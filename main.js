//included libs
var uinput = require('./lib/uinput');
var keycodes = require('./lib/keycodes')
var virtual_keyboard = require('./lib/virtual_keyboard');
var mapping = require('./mapping_keyboard');
var kb = new virtual_keyboard;

//i2c libs
var i2c = require('i2c');
var address = 0x52; //default address of controller
var wire = new i2c(address, {device: '/dev/i2c-1'});

//We can do a max of two keys at a time, its a NES pad so this is probably fine
function getKeysFromBytes(bytes) { 
    //TODO: move byte mappings somewhere else
    var buttons = {
        'UP':{'key':mapping.GP_UP, 'value':0},
        'DOWN':{'key':mapping.GP_DOWN, 'value':0},
        'LEFT':{'key':mapping.GP_LEFT, 'value':0},
        'RIGHT':{'key':mapping.GP_RIGHT, 'value':0},
        'A':{'key':mapping.GP_A, 'value':0},
        'B':{'key':mapping.GP_B, 'value':0},
        'SELECT':{'key':mapping.GP_SELECT, 'value':0},
        'START':{'key':mapping.GP_START, 'value':0},
    };

    //DIRECTIONAL - Single
    if(bytes[5] === 254) { //UP
        buttons.UP.value = 1;
    }
    if(bytes[4] === 191) { //DOWN
        buttons.DOWN.value = 1;
    }
    if(bytes[5] === 253) { //LEFT
        buttons.LEFT.value = 1;
    }
    if(bytes[4] === 127) { //RIGHT
        buttons.RIGHT.value = 1;
    }

    //BUTTONS - Single
    if(bytes[4] === 239) { //SELECT
        buttons.SELECT.value = 1;
    }
    if(bytes[4] === 251) { //START
        buttons.START.value = 1;
    }
    if(bytes[5] === 239) { //A
        buttons.A.value = 1;
    }
    if(bytes[5] === 191) { //B
        buttons.B.value = 1;
    }

    //COMBOS - Two keys at once but on the same byte
    if(bytes[5] === 238) {//A & UP
        buttons.A.value = 1;
        buttons.UP.value = 1;
    } 
    if(bytes[5] === 190) {//B & UP
        buttons.B.value = 1;
        buttons.UP.value = 1;
    } 
    if(bytes[4] === 235) {//SELECT & START
        buttons.SELECT.value = 1;
        buttons.START.value = 1;
    }
    if(bytes[5] === 237) { //A & LEFT
        buttons.A.value = 1;
        buttons.LEFT.value = 1;
    }
    if(bytes[5] === 189) { //B & LEFT
        buttons.B.value = 1;
        buttons.LEFT.value = 1;
    }
    if(bytes[5] === 252) { //UP & LEFT
        buttons.UP.value = 1;
        buttons.LEFT.value = 1;
    }
    if(bytes[4] === 63) {//DOWN & RIGHT
        buttons.DOWN.value = 1;
        buttons.RIGHT.value = 1;
    }
    if(bytes[4] === 175) {//DOWN & SELECT
        buttons.DOWN.value = 1;
        buttons.RIGHT.value = 1;
    }
    if(bytes[4] === 187) {//DOWN & START
        buttons.START.value = 1;
        buttons.DOWN.value = 1;
    }
    if(bytes[4] === 111) {//RIGHT & SELECT
        buttons.SELECT.value = 1;
        buttons.RIGHT.value = 1;
    }
    if(bytes[4] === 123) {//RIGHT & START
        buttons.SELECT.value = 1;
        buttons.DOWN.value = 1;
    }
    if(bytes[5] === 175) { //A & B
        buttons.A.value = 1;
        buttons.B.value = 1;
    }
  
    return buttons;
}

function writeI2CtoKeyboard(delay) {
    var oldRes = [255,255,255,255,255,255]; //populate it so we have no null issues
    setInterval(function () {

        wire.read(6, function(err, res) {
            
            if(res.length == 6) { //array needs to be 6bytes
                if (res[0] != 1 && (res[0] != 255 && res[1] != 255)) { // there are 'heartbeat' pulses, we ignore these

                    var newButtons = getKeysFromBytes(res);
                    var oldButtons = getKeysFromBytes(oldRes);

                    if(newButtons != null && oldButtons != null) {
                        if(newButtons.UP.value != oldButtons.UP.value) {
                            sendKeys(newButtons.UP.key, newButtons.UP.value);
                        }
                        if(newButtons.DOWN.value != oldButtons.DOWN.value) {
                            sendKeys(newButtons.DOWN.key, newButtons.DOWN.value);
                        }
                        if(newButtons.LEFT.value != oldButtons.LEFT.value) {
                            sendKeys(newButtons.LEFT.key, newButtons.LEFT.value);
                        }
                        if(newButtons.RIGHT.value != oldButtons.RIGHT.value) {
                            sendKeys(newButtons.RIGHT.key, newButtons.RIGHT.value);
                        }
                        if(newButtons.A.value != oldButtons.A.value) {
                            sendKeys(newButtons.A.key, newButtons.A.value);
                        }
                        if(newButtons.B.value != oldButtons.B.value) {
                            sendKeys(newButtons.B.key, newButtons.B.value);
                        }
                        if(newButtons.SELECT.value != oldButtons.SELECT.value) {
                            sendKeys(newButtons.SELECT.key, newButtons.SELECT.value);
                        }
                        if(newButtons.START.value != oldButtons.START.value) {
                            sendKeys(newButtons.START.key, newButtons.START.value);
                        }
                    }
                    oldRes = res;
                }
            }
        });
    }, delay);
}

function sendKeys(key, value) {
    if(key > 0) {
        kb.sendEvent({type: uinput.EV_KEY, code: key, value: value});
    }
}

function main() {
    console.log('Starting Up...');
    kb.connect(function() {
        console.log('Keyboard Connected!');
        writeI2CtoKeyboard(5) //delay in ms
    });
}

main();