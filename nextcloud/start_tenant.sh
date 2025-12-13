#!/bin/bash
# Simpan sebagai: start_tenant.sh

if [ "$#" -ne 1 ]; then
    echo "Usage: sudo ./start_tenant.sh <nama_tenant>"
    exit 1
fi

TENANT_NAME=$1
BASE_DIR=$(pwd)
TARGET_DIR="$BASE_DIR/nextcloud/tenants/$TENANT_NAME"
IMG_FILE="$TARGET_DIR/storage.img"
MOUNT_POINT="$TARGET_DIR/nextcloud_data"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Tenant tidak ditemukan."
    echo "$TARGET_DIR tidak ada."
    exit 1
fi

echo "=== Menyalakan Tenant: $TENANT_NAME ==="

# 1. Cek apakah sudah ter-mount?
if mountpoint -q "$MOUNT_POINT"; then
    echo "[Info] Storage sudah ter-mount."
else
    echo "[+] Melakukan Mounting Storage..."
    mount -o loop "$IMG_FILE" "$MOUNT_POINT"
    # Fix permission setiap kali mount ulang (jaga-jaga)
    chown -R 33:33 "$MOUNT_POINT"
    chmod -R 0770 "$MOUNT_POINT"
fi

# 2. Nyalakan Docker
echo "[+] Menyalakan Container..."
cd "$TARGET_DIR"
docker compose up -d

echo "=== Selesai. Tenant Online. ==="
