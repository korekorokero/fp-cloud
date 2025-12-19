#!/bin/bash

if [ "$#" -ne 3 ]; then
    echo "Usage: sudo ./create_tenant.sh <nama> <port> <size>"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then echo "Harap jalankan dengan sudo!"; exit 1; fi

TENANT_NAME=$1
PORT=$2
SIZE=$3
BASE_DIR=$(pwd)
TARGET_DIR="$BASE_DIR/nextcloud/tenants/$TENANT_NAME"
IMG_FILE="$TARGET_DIR/storage.img"
MOUNT_POINT="$TARGET_DIR/nextcloud_data"

HOST_BASE=${HOST_PROJECT_PATH:-$BASE_DIR}
HOST_DATA_DIR="$HOST_BASE/nextcloud_tenants/$TENANT_NAME/nextcloud_data"

# 1. Setup Folder
if [ -d "$TARGET_DIR" ]; then echo "Error: Tenant sudah ada!"; exit 1; fi
mkdir -p "$TARGET_DIR"

# 2. Setup Storage (Hard Limit)
echo "[+] Membuat Virtual Disk $SIZE..."
fallocate -l $SIZE "$IMG_FILE"
mkfs.ext4 -F "$IMG_FILE" > /dev/null

echo "[+] Mounting Disk..."
mkdir -p "$MOUNT_POINT"
mount -o loop "$IMG_FILE" "$MOUNT_POINT"

# --- [FIX 1] PERMISSIONS (GANTI JADI 0770) ---
echo "[+] Fixing Permissions (Secure Mode)..."
rm -rf "$MOUNT_POINT/lost+found"
chown -R 33:33 "$MOUNT_POINT"
chmod -R 0770 "$MOUNT_POINT"  # <-- INI KUNCINYA (Jangan 777)
# ---------------------------------------------

# 3. Setup Docker
echo "[+] Menyalakan Container..."
cp "$BASE_DIR/nextcloud/templates/docker-compose.yml" "$TARGET_DIR/docker-compose.yml"
echo "TENANT_NAME=$TENANT_NAME" > "$TARGET_DIR/.env"
echo "PORT_WEB=$PORT" >> "$TARGET_DIR/.env"
echo "HOST_DATA_DIR=$HOST_DATA_DIR" >> "$TARGET_DIR/.env"

cd "$TARGET_DIR"
docker compose up -d

# --- [FIX 2] TRUSTED DOMAINS ---
echo "[+] Mengonfigurasi Trusted Domains..."
sleep 10  # Beri waktu container booting
docker exec --user www-data "${TENANT_NAME}_app" php occ config:system:set trusted_domains 1 --value=* > /dev/null 2>&1
# -------------------------------

echo "=== SUKSES! Tenant '$TENANT_NAME' Aktif ==="
echo "URL: http://localhost:$PORT"
