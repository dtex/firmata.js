var Board = require("../");

Board.requestPort(function(error, port) {
  if (error) {
    console.log(error);
    return;
  }
  var board = new Board(port.comName);

  board.on("ready", function() {
    console.log("READY");

    board.spiConfig();

    var dummyDeviceId = 9;
    board.spiBeginTransaction(dummyDeviceId, {
      bitOrder: board.SPI_BIT_ORDER.LSBFIRST,
      dataMode: board.SPI_DATA_MODES.MODE0,
      maxClockSpeed: 20000000,
      csPin: 8
    });

    var dummyData = [235, 244, 32, 0];

    // test READ_WRITE
    console.log("test read/write");
    board.spiTransfer({
      transferOptions: board.SPI_TRANSFER_OPTIONS.READ_WRITE,
      pinOptions: 0x01, // csActive
      numBytes: dummyData.length,
      inBytes: dummyData
    }, function(data) {
      console.log("spi reply: ");
      console.log(data);
    });

    // test READ_ONLY
    // console.log("test read-only");
    // board.spiTransfer({
    //   transferOptions: board.SPI_TRANSFER_OPTIONS.READ_ONLY,
    //   pinOptions: 0x01, // csActive
    //   numBytes: 10,
    // }, function(data) {
    //   console.log("got spi reply: ");
    //   console.log(data);
    // });

    // test WRITE_ONLY
    // console.log("test write-only");
    // board.spiTransfer({
    //   transferOptions: board.SPI_TRANSFER_OPTIONS.WRITE_ONLY,
    //   pinOptions: 0x01, // csActive
    //   numBytes: dummyData.length,
    //   inBytes: dummyData
    // });

    // get debug messages from board
    board.on("string", function (message) {
      console.log("message from board: " + message);
    });

  });
});
