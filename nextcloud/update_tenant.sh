#!/bin/bash

# --- FUNGSI BANTUAN ---
usage() {
    echo "Usage: sudo ./update_tenant.sh <nama_tenant_saat_ini> [OPTIONS]"
    echo "Options:"
    echo "  -p <port>   : Mengubah port web (misal: 8085)"
    echo "  -s <size>   : Menambah ukuran storage (misal: 5G). HANYA BISA DIPERBESAR."
    echo "  -n <nama>   : Mengubah nama tenant (Warning: Reset Database Account)"
    echo ""
    echo "Contoh: sudo ./update_tenant.sh client_a -p 9090 -s 5G"
    exit 1
}

# --- CEK ROOT ---
if [ "$EUID" -ne 0 ]; then
  echo "Error: Script ini harus dijalankan dengan 'sudo'."
  exit 1
fi

# --- PARSING ARGUMEN UTAMA ---
if [ -z "$1" ]; then
    usage
fi

CURRENT_NAME=$1
shift # Geser argumen agar $1 sekarang menjadi flags (-p, -n, dsb)

BASE_DIR=$(pwd)
TARGET_DIR="$BASE_DIR/nextcloud/tenants/$CURRENT_NAME"
ENV_FILE="$TARGET_DIR/.env"
IMG_FILE="$TARGET_DIR/storage.img"
MOUNT_POINT="$TARGET_DIR/nextcloud_data"

# Cek apakah tenant ada
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Tenant '$CURRENT_NAME' tidak ditemukan!"
    exit 1
fi

# Inisialisasi Variabel Perubahan
NEW_PORT=""
NEW_SIZE=""
NEW_NAME=""

# --- PARSING FLAGS (getopts) ---
while getopts "p:s:n:" opt; do
  case $opt in
    p) NEW_PORT="$OPTARG" ;;
    s) NEW_SIZE="$OPTARG" ;;
    n) NEW_NAME="$OPTARG" ;;
    *) usage ;;
  esac
done

# Jika tidak ada flag yang diberikan
if [ -z "$NEW_PORT" ] && [ -z "$NEW_SIZE" ] && [ -z "$NEW_NAME" ]; then
    echo "Info: Tidak ada perubahan yang diminta. Gunakan -p, -s, atau -n."
    exit 0
fi

echo "=== MEMULAI UPDATE OTOMATIS UNTUK: $CURRENT_NAME ==="

# 1. Matikan Container & Unmount (Prosedur Standar)
echo "[1/5] Menghentikan layanan..."
cd "$TARGET_DIR" || exit
docker compose down > /dev/null 2>&1
umount "$MOUNT_POINT" 2>/dev/null || true

# 2. PROSES: RESIZE STORAGE (Jika diminta)
if [ ! -z "$NEW_SIZE" ]; then
    echo "[+] Memproses Resize Storage ke $NEW_SIZE..."
    
    # Perbesar fisik file
    truncate -s "$NEW_SIZE" "$IMG_FILE"
    
    # Resize filesystem (ext4)
    # Kita perlu mount sebagai loop device sementara untuk resize
    LOOP_DEV=$(losetup --find --show "$IMG_FILE")
    e2fsck -f -p "$LOOP_DEV" > /dev/null 2>&1 # Check disk
    resize2fs "$LOOP_DEV" > /dev/null         # Resize filesystem
    losetup -d "$LOOP_DEV"                    # Detach
    
    echo "    -> Storage berhasil di-expand."
fi

# 3. PROSES: GANTI PORT (Jika diminta)
if [ ! -z "$NEW_PORT" ]; then
    echo "[+] Mengubah Port ke $NEW_PORT..."
    sed -i "s/^PORT_WEB=.*/PORT_WEB=$NEW_PORT/" "$ENV_FILE"
fi

# 4. PROSES: RENAME TENANT (Jika diminta)
FINAL_DIR="$TARGET_DIR" # Defaultnya direktori tetap sama
if [ ! -z "$NEW_NAME" ]; then
    NEW_TARGET_DIR="$BASE_DIR/nextcloud/tenants/$NEW_NAME"
    
    if [ -d "$NEW_TARGET_DIR" ]; then
        echo "Error: Gagal rename. Tenant '$NEW_NAME' sudah ada."
        # Kita coba nyalakan lagi tenant lama agar tidak mati total
        mount -o loop "$IMG_FILE" "$MOUNT_POINT"
        docker compose up -d
        exit 1
    fi

    echo "[+] Mengubah Nama Tenant menjadi '$NEW_NAME'..."
    
    # Pindah folder
    cd "$BASE_DIR/nextcloud/tenants"
    mv "$CURRENT_NAME" "$NEW_NAME"
    
    # Update variabel di .env
    sed -i "s/^TENANT_NAME=.*/TENANT_NAME=$NEW_NAME/" "$NEW_TARGET_DIR/.env"
    
    FINAL_DIR="$NEW_TARGET_DIR"
    IMG_FILE="$FINAL_DIR/storage.img"
    MOUNT_POINT="$FINAL_DIR/nextcloud_data"
    
    echo "    -> Warning: Database baru akan dibuat untuk nama baru."
fi

# 5. Nyalakan Kembali (Finalizing)
echo "[5/5] Menyalakan kembali layanan..."

# Pastikan folder mount point ada (terutama jika direname)
mkdir -p "$MOUNT_POINT"

# Mount storage
mount -o loop "$IMG_FILE" "$MOUNT_POINT"
rm -rf "$MOUNT_POINT/lost+found" 2>/dev/null
chown -R 33:33 "$MOUNT_POINT"
chmod -R 0770 "$MOUNT_POINT" # <-- Pastikan ini 0770 juga!

# Start Docker
cd "$FINAL_DIR" || exit
docker compose up -d > /dev/null 2>&1

# --- TAMBAHAN: AUTO FIX TRUSTED DOMAINS ---
echo "[+] Mengupdate Trusted Domains..."
# Kita tunggu sebentar agar container siap menerima perintah
sleep 5
docker exec --user www-data "${NEW_NAME:-$CURRENT_NAME}_app" php occ config:system:set trusted_domains 1 --value=* > /dev/null 2>&1 || echo "Warning: Gagal update trusted domains (container mungkin belum siap)"
# ------------------------------------------

echo "============================================="
echo "UPDATE SELESAI!"
if [ ! -z "$NEW_NAME" ]; then
    echo "Tenant : $NEW_NAME"
else
    echo "Tenant : $CURRENT_NAME"
fi
echo "Status : Online"
echo "============================================="
