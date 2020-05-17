const fs = require('fs');
const miio = require('miio');
let Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    if (!isConfig(homebridge.user.configPath(), "accessories", "MiMultifunctionAirMonitor")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-mi-multifunctionairmonitor', 'MiMultifunctionAirMonitor', MiMultifunctionAirMonitor);
}

function isConfig(configFile, type, name) {
    const config = JSON.parse(fs.readFileSync(configFile));
    if ("accessories" === type) {
        const accessories = config.accessories;
        for (let i in accessories) {
            if (accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if ("platforms" === type) {
        const platforms = config.platforms;
        for (let i in platforms) {
            if (platforms[i]['platform'] === name) {
                return true;
            }
        }
    }

    return false;
}

function MiMultifunctionAirMonitor(log, config) {
    if (null == config) {
        return;
    }

    this.log = log;
    this.config = config;

    const that = this;
    that.options = {"retries": 1}

    miio.device({
        address: that.config.ip,
        token: that.config.token
    }).then(device => {
        that.log.debug("[MiMultifunctionAirMonitor][DEBUG] Successfully connected to device.");
        that.device = device;
    })
        .catch(err => {
            that.log.error("[MiMultifunctionAirMonitor][ERROR] Device connection error: " + err);
        })
}

MiMultifunctionAirMonitor.prototype = {
    identify: function (callback) {
        callback();
    },

    getServices: function () {
        const that = this;
        const services = [];

        const infoService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, "Xiaomi");
        services.push(infoService);

        const pmService = new Service.AirQualitySensor(this.config['name']);

        if (that.config.pm25SensorEnabled !== false) {
            that.pm2_5Characteristic = pmService.addCharacteristic(Characteristic.PM2_5Density);
        }

        if (that.config.co2SensorEnabled !== false) {
            that.co2Characteristic = pmService.addCharacteristic(Characteristic.CarbonDioxideLevel);
        }

        if (that.config.tvocSensorEnabled !== false) {
            that.tvocCharacteristic = pmService.addCharacteristic(Characteristic.VOCDensity);
        }

        pmService
            .getCharacteristic(Characteristic.AirQuality)
            .on('get', function (callback) {
                that.device.call("get_air_data", [], that.options).then(result => {
                    that.log.debug("[MiMultifunctionAirMonitor][DEBUG] getState: " + JSON.stringify(result));

                    let pm25_quality = 0;
                    if (that.config.pm25SensorEnabled !== false) {

                        let pm25 = result['pm25'];
                        that.pm2_5Characteristic.updateValue(pm25);

                        if (pm25 <= 50) {
                            pm25_quality = Characteristic.AirQuality.EXCELLENT;
                        } else if (pm25 > 75 && pm25 <= 115) {
                            pm25_quality = Characteristic.AirQuality.GOOD;
                        } else if (pm25 > 115 && pm25 <= 150) {
                            pm25_quality = Characteristic.AirQuality.FAIR;
                        } else if (pm25 > 150 && pm25 <= 250) {
                            pm25_quality = Characteristic.AirQuality.INFERIOR;
                        } else if (pm25 > 250) {
                            pm25_quality = Characteristic.AirQuality.POOR;
                        } else {
                            pm25_quality = Characteristic.AirQuality.UNKNOWN;
                        }
                    }

                    let tvoc_quality = 0;
                    if (that.config.tvocSensorEnabled !== false) {

                        let tvoc = result['tvoc'];
                        that.tvocCharacteristic.updateValue(tvoc);

                        if (tvoc <= 0.3) {
                            tvoc_quality = Characteristic.AirQuality.EXCELLENT;
                        } else if (tvoc > 0.3 && tvoc <= 1) {
                            tvoc_quality = Characteristic.AirQuality.GOOD;
                        } else if (tvoc > 1 && tvoc <= 3) {
                            tvoc_quality = Characteristic.AirQuality.FAIR;
                        } else if (tvoc > 3 && tvoc <= 9) {
                            tvoc_quality = Characteristic.AirQuality.INFERIOR;
                        } else if (tvoc > 9) {
                            tvoc_quality = Characteristic.AirQuality.POOR;
                        } else {
                            tvoc_quality = Characteristic.AirQuality.UNKNOWN;
                        }
                    }

                    let co2_quality = 0;
                    if (that.config.co2SensorEnabled !== false) {

                        let co2 = result['co2e'];
                        that.co2Characteristic.updateValue(co2);

                        if (co2 <= 1000) {
                            co2_quality = Characteristic.AirQuality.EXCELLENT;
                        } else if (co2 > 1000 && co2 <= 2000) {
                            co2_quality = Characteristic.AirQuality.GOOD;
                        } else if (co2 > 2000 && co2 <= 3000) {
                            co2_quality = Characteristic.AirQuality.FAIR;
                        } else if (co2 > 3000 && co2 <= 4000) {
                            co2_quality = Characteristic.AirQuality.INFERIOR;
                        } else if (co2 > 4000) {
                            co2_quality = Characteristic.AirQuality.POOR;
                        } else {
                            co2_quality = Characteristic.AirQuality.UNKNOWN;
                        }
                    }

                    let quality = Math.max(pm25_quality, tvoc_quality, co2_quality);
                    callback(null, quality);

                }).catch(function (err) {
                    that.log.error("[MiMultifunctionAirMonitor][ERROR] getState Error: " + err);
                    callback(err);
                });
            }.bind(this));
        services.push(pmService);

        const temperatureService = new Service.TemperatureSensor(this.config['temperatureName']);
        temperatureService
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({minValue: -273, maxValue: 200})
            .on("get", function (callback) {
                that.device.call("get_air_data", [], that.options).then(result => {
                    that.log.debug("[MiMultifunctionAirMonitor][DEBUG] getState: " + JSON.stringify(result));

                    let temperature = result['temperature'];
                    callback(null, temperature);

                }).catch(function (err) {
                    that.log.error("[MiMultifunctionAirMonitor][ERROR] getState Error: " + err);
                    callback(err);
                });
            }.bind(this));
        services.push(temperatureService);

        const humidityService = new Service.HumiditySensor(this.config['humidityName']);
        humidityService
            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .setProps({minValue: 0, maxValue: 100})
            .on("get", function (callback) {
                that.device.call("get_air_data", [], that.options).then(result => {
                    that.log.debug("[MiMultifunctionAirMonitor][DEBUG] getState: " + JSON.stringify(result));

                    let humidity = result['humidity'];
                    callback(null, humidity);

                }).catch(function (err) {
                    that.log.error("[MiMultifunctionAirMonitor][ERROR] getState Error: " + err);
                    callback(err);
                });
            }.bind(this));
        services.push(humidityService);

        const batteryService = new Service.BatteryService();
        const batLowCharacteristic = batteryService.getCharacteristic(Characteristic.StatusLowBattery);
        const batLevelCharacteristic = batteryService.getCharacteristic(Characteristic.BatteryLevel);
        batLevelCharacteristic
            .on('get', function (callback) {
                that.device.call("get_value", ["battery"], that.options).then(result => {
                    that.log.debug("[MiMultifunctionAirMonitor][DEBUG] - Battery - getLevel: " + result['battery']);
                    batLowCharacteristic.updateValue(result['battery'] < 20 ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
                    callback(null, result['battery']);
                }).catch(function (err) {
                    that.log.error("[MiMultifunctionAirMonitor][ERROR] - Battery - getLevel Error: " + err);
                    callback(err);
                });
            }.bind(this));

        services.push(batteryService);

        return services;
    }
}