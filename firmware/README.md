
# Example commandline

python esptool.py --chip esp32 --port "port" --baud 230400 --before default_reset --after hard_reset write_flash -z --flash_mode dio --flash_freq 40m --flash_size 4MB 0x1000 bootloader.bin 0x8000 partitions.bin 0xe000 boot_app0.bin 0x10000 firmware.bin

# Values for the layout (mey vary depending on board)

0x01000 = 4096 = bootloader
0x08000 = 32768 = partitions
0x0e000 = 57344 = boot
0x10000 = 65536 = firmware