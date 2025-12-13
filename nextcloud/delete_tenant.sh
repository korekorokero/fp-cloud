#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: sudo ./delete_tenant.sh <nama_tenant>"
    exit 1
fi

# Cek sudo karena kita perlu melakukan 'umount'
if [ "$EUID" -ne 0 ]; then
  echo "Script ini HARUS dijalankan dengan 'sudo' untuk melepas mount storage."
  exit
fi

TENANT_NAME=$1
BASE_DIR=$(pwd)
TARGET_DIR="$BASE_DIR/nextcloud/tenants/$TENANT_NAME"
MOUNT_POINT="$TARGET_DIR/nextcloud_data"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Tenant '$TENANT_NAME' tidak ditemukan!"
    exit 1
fi

echo "[1/4] Menghentikan container..."
cd "$TARGET_DIR"
# flag -v akan menghapus volume database (mariadb) agar bersih total
docker compose down -v 

echo "[2/4] Melepas mount point storage..."
# Kita coba unmount. Jika gagal (misal tidak ter-mount), kita lanjut saja.
umount "$MOUNT_POINT" 2>/dev/null || echo "Info: Folder tidak sedang di-mount atau sudah terlepas."

echo "[3/4] Menghapus file dan direktori tenant..."
cd "$BASE_DIR/nextcloud/"
rm -rf "$TARGET_DIR"

echo "[4/4] Selesai."
echo "Tenant '$TENANT_NAME' berhasil dihapus."
