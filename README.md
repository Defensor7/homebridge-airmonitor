# homebridge-MiMultifunctionAirMonitor
[![npm version](https://badge.fury.io/js/homebridge-airmonitor.svg)](https://badge.fury.io/js/homebridge-airmonitor)

Xiaomi MultifunctionAirMonitor plugin for HomeBridge.   
   
Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), all other developer and testers.   
   
**Note: If you find bugs, please submit them to [issues](https://github.com/Defensor7/homebridge-airmonitor/issues).**   

![](https://raw.githubusercontent.com/Defensor7/homebridge-airmonitor/master/images/airmonitor.jpg)

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g homebridge-airmonitor
```

## Configuration
```
"accessories": [{
    "accessory": "MiMultifunctionAirMonitor",
    "name": "AirQuality Sensor",
    "temperatureName": "Temparature Sensor",
    "humidityName": "Humidity Sensor",    
    "ip": "192.168.1.100",
    "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}]
```

## Get token
For more information about token, please refer to [docs](https://github.com/Maxmudjon/com.xiaomi-miio/blob/master/docs/obtain_token.md).   
 
