# Current Guess at the BLE api
Service: 9da2ddf1-0000-44d0-909c-3f3d3cb34a7b
 - 9da2ddf1-0001-44d0-909c-3f3d3cb34a7b (notify/write) UNK

Service: 932c32bd-0000-47a2-835a-a8d455b859dd
 - 932c32bd-0001-47a2-835a-a8d455b859dd (read) UNK
 - 932c32bd-0002-47a2-835a-a8d455b859dd (notify/read/write) Power
	- 0x00 - Off
	- 0x01 - On
 - 932c32bd-0003-47a2-835a-a8d455b859dd (notify/read/write) Brightness
	- 0xfe - Max Brightness
	- 0x01 - Min Brightness
 - 932c32bd-0004-47a2-835a-a8d455b859dd (notify/read/write) Temperature / Warmth
	- 0xTT0E - TT is temp in warmness units (my max is 0xf4), E is whether this warmth is enabled or not
	- 0x0001 - Coolest
	- 0xf401 - Warmest
	- 0xffff - Sigil meaning that color is used
 - 932c32bd-0005-47a2-835a-a8d455b859dd (notify/read/write) Color
	- Write: 0xXXXXYYYY - X and Y are between 0x0001-0xfffe
	- I don't understand the format when being read
	- 0xffffffff - Sigil value meaning temp is used
 - 932c32bd-0006-47a2-835a-a8d455b859dd (write) Action
	- 0x00 - Nothing?
	- 0x01 - Quick change to value, and then fade back? (Used to identify which bulb you're connect to I believe)
	- 0x02 - Blink the lamp a bunch of times (Used by the timer feature I believe)
 - 932c32bd-0007-47a2-835a-a8d455b859dd (notify/read/write) Control
	- Type + Length + Value sequence without duplicates
	- Type 0x01 (1-byte) Power
		- 0x010100 - Turn off
		- 0x010101 - Turn On
	- Type 0x02 (1-byte) Brightness
		- 0x0201fe - Max brightness
		- 0x020101 - Min Brightness
	- Type 0x03 (2-byte) Temperature
		- 0x0302f401 - Max warmth
		- 0x0302ab00 - Mid Temp, but disabled
	- Type 0x04 (4-byte) Color
		- 0x040400010001 - Deep Blue
	- Type 0x05 Unknown, but seems to be 2-bytes.  It would make sense if you could also set the Action field, but that's only 1 byte, so...
	- Type 0x06 (1-byte) - Animation
		- 0x060100 - No animation
		- 0x060101 - Candle Flicker
		- 0x060102 - Fireplace Flicker?
		- 0x060103 - Rotate Color
	- Type 0x07 - Unknown, but seems to be 2-bytes?
	- Type 0x08 (1-byte) - Animation Speed
		- 0x080100 - Paused
		- 0x080101 - Slowest
		- 0x0801FE - Fastest

 - 932c32bd-1005-47a2-835a-a8d455b859dd (read/write) Power Up Control
	- Almost exactly the same as 0007, except it also allows setting sigil values (I believe this is how you resume previous settings)
	- 0x0101010201fe03026e010404ffffffff = Default setting
	- 0x0101010201ff0302ffff0404ffffffff = Last Used color and brightness
	- 0x0101ff0201ff0302ffff0404ffffffff = Last Used Color, Brightness, and on/off state

Service: b8843add-0000-4aa1-8794-c3f462030bda
 - b8843add-0001-4aa1-8794-c3f462030bda (read) - UNK
	- 0xffffffffffffffffff00
 - b8843add-0002-4aa1-8794-c3f462030bda (indicate/notify/write)
 - b8843add-0003-4aa1-8794-c3f462030bda (write)
 - b8843add-0004-4aa1-8794-c3f462030bda (read) - UNK
	- 0x01

Service: 0000fe0f-0000-1000-8000-00805f9b34fb
 - 97fe6561-0001-4f62-86e9-b71ee2da3d22 (read)
 - 97fe6561-0003-4f62-86e9-b71ee2da3d22 (read/write) Device Name
 - 97fe6561-0004-4f62-86e9-b71ee2da3d22 (write)
	- 0x00-0x01 -> Factory Reset?
 - 97fe6561-0005-4f62-86e9-b71ee2da3d22 (indicate/write)
	- 0x0000XX00YY XX is 0x00-0x4d and YY is 0x00-0xff -> UNK
	- 0x00 -> UNK
 - 97fe6561-0006-4f62-86e9-b71ee2da3d22 (read/write)
	- 0x00-0xff -> UNK
 - 97fe6561-0008-4f62-86e9-b71ee2da3d22 (indicate/notify/write)

 - 97fe6561-1001-4f62-86e9-b71ee2da3d22 (indicate/notify/read/write)
	- Clock/Timer?
	- Increments the first byte, and overflows into the following 3 bytes (I think)
	- Once it hits 0x00000000 it stops incrementing
- 97fe6561-2001-4f62-86e9-b71ee2da3d22 (read/write)
	- 0x02 at reset?
	- Set 0x01 reads 0x0a
 - 97fe6561-2002-4f62-86e9-b71ee2da3d22 (write)
 - 97fe6561-2004-4f62-86e9-b71ee2da3d22 (write)
 - 97fe6561-a001-4f62-86e9-b71ee2da3d22 (write)
 - 97fe6561-a002-4f62-86e9-b71ee2da3d22 (read)
	- Timer? Sensor?
	- 0x80
	- Something around 0xd0
 - 97fe6561-a003-4f62-86e9-b71ee2da3d22 (read/write) - Another Mode specifier?
	- 0x00 - Turn Demo Off
	- 0x01 - Turn Demo On
	- 0x02 - ¿Timer/Alarm?

Service: 0000180a-0000-1000-8000-00805f9b34fb
 - 00002a24-0000-1000-8000-00805f9b34fb (read) Model
 - 00002a28-0000-1000-8000-00805f9b34fb (read) Firmware Version
 - 00002a29-0000-1000-8000-00805f9b34fb (read) Manufacturer
