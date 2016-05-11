#!/bin/sh

SERIALPORT=${1:-"/dev/cu.usbserial"}
ESPTOOL="python ./util/esptool/esptool.py --port $SERIALPORT"

if ! [ -f "util/build/spiffs.bin" ]; then
	echo $'\nBuilding the static files...'
	util/build.js 
fi

echo $'\nHi!'
echo "Connect the GPIO0 of the ESP8266 to ground..."
echo "Reset It..."

read -p $'And press ENTER to continue...\n\n'

$ESPTOOL write_flash 0x00000 .pioenvs/esp01/firmware.bin

echo $'\nFirmware uploaded!'
echo "Reset the ESP8266 once again..."
read -p $'And press ENTER to continue...\n\n'

$ESPTOOL write_flash 0x6b000 util/build/spiffs.bin

echo $'\nI\'m done here. Thank you!\n'
