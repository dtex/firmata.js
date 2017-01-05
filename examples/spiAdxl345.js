var Board = require("../");

Board.requestPort(function(error, port) {
  if (error) {
    console.log(error);
    return;
  }
  var board = new Board(port.comName);

  var register = {
    POWER: 0x2D,
    RANGE: 0x31,
    READ: 0x32,
  };

  var READ_BIT = 0x80;
  var MULTI_BYTE_BIT = 0x40;

  board.on("ready", function() {
    console.log("READY");

    var RW = board.SPI_TRANSFER_OPTIONS.READ_WRITE;
    var RO = board.SPI_TRANSFER_OPTIONS.READ_ONLY;
    var WO = board.SPI_TRANSFER_OPTIONS.WRITE_ONLY;

    var MSBFIRST = board.SPI_BIT_ORDER.MSBFIRST;
    var LSBFIRST = board.SPI_BIT_ORDER.LSBFIRST;

    var sensitivity = 0.00390625;

    board.spiConfig();

    var deviceId = 9;
    board.spiBeginTransaction(deviceId, {
      bitOrder: MSBFIRST,
      dataMode: board.SPI_DATA_MODES.MODE3,
      maxClockSpeed: 5000000, // 5 Mhz
      csPin: 2
    });

    board.spiTransfer({
      transferOptions: WO,
      pinOptions: 0x01, // csActive
      inBytes: [register.POWER, 0x00]
    });

    // measurement mode
    board.spiTransfer({
      transferOptions: WO,
      pinOptions: 0x01, // csActive
      inBytes: [register.POWER, 0x08]
    });

    // full res, 2G, 4-wire SPI
    board.spiTransfer({
      transferOptions: WO,
      pinOptions: 0x01, // csActive
      inBytes: [register.RANGE, 0x08]
    });

    // setup multi-byte read
    var readAddress = register.READ | READ_BIT | MULTI_BYTE_BIT;

    var counter = 100;
    var interval = setInterval(function() {
      // set CS LOW and write READ register
      board.spiTransfer({
        transferOptions: WO,
        pinOptions: 0x05, // csActive | csStartOnly
        inBytes: [readAddress]
      });

      // read 6 bytes then set CS HIGH
      board.spiTransfer({
        transferOptions: RO,
        pinOptions: 0x09, // csActive | csEndOnly,
        numBytes: 6
      }, function(data) {
        console.log(data);
        var x = (data[1] << 8) | data[0];
        var y = (data[3] << 8) | data[2];
        var z = (data[5] << 8) | data[4];

        // Wrap and clamp 16 bits;
        var X = (x >> 15 ? ((x ^ 0xFFFF) + 1) * -1 : x) * sensitivity;
        var Y = (y >> 15 ? ((y ^ 0xFFFF) + 1) * -1 : y) * sensitivity;
        var Z = (z >> 15 ? ((z ^ 0xFFFF) + 1) * -1 : z) * sensitivity;

        console.log("X: ", X);
        console.log("Y: ", Y);
        console.log("Z: ", Z);
      });

      if (--counter === 0) {
        clearInterval(interval);
        console.log("done");
      }
    }, 100);


    // get debug messages from board
    board.on("string", function (message) {
      console.log("message from board: " + message);
    });

  });
});
