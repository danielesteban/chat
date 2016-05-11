chat
==============================

A retro-style webchat server/client for the esp8266

**Step by Step Guide:**

* Install [PlatformIO](http://docs.platformio.org/en/latest/installation.html) & [NodeJS](https://nodejs.org/en/download/).

* Clone this repo and it's submodules.

  ```git clone --recursive https://github.com/danielesteban/chat.git && cd chat```

* Compile mkspiffs

  ```make -C util/mkspiffs```

* Install the required modules for building the static files.

  ```npm install --prefix ./util/ closurecompiler fs-extra node-sass```

* Connect your esp8266 to the computer trough a serial to usb adapter (or similar).

* Connect the GPIO0 of the esp8266 to the ground rail and reset it.
  (This will reboot the esp8266 into the bootloader)

* Compile & Upload:

  ```platformio run && util/flash.sh [THE_ESP8266_SERIALPORT]```
  (This will compile the firmware, build the static files, flash the firmware & upload the spiffs image)

**License:**

The MIT License (MIT)

Copyright (c) 2016 Daniel Esteban Nombela

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
