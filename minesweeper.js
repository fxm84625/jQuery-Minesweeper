// Default parameters for Expert (hard) mode
var playingStatus = 'playing';
var firstClick = true;
var diff = 2;
var height = 16;
var width = 30;
var mines = 99;
var currentMines = mines;
var timer = 0;
var timerInterval;
var timerStarted = false;
var gameTiles = [];   // Array of numbers to represent the board's mines and mine indicators
                        // -1   = Mine
                        //  0-8 = Other numbers determine how many mines are around itself

var shownTiles = [];  // Array of numbers to represent each tile's status
                        // -3 = incorrect bomb flagging, revealed after a game loss
                        // -2 = the bombs that are revealed after a game loss
                        // -1 = the bomb the user clicked on to lose the game
                        //  0 = not revealed
                        //  1 = revealed
                        //  2 = flagged - user's set flag icon
                        //  3 = unknown - user's set question mark icon

function startGame() {
  // Starts a new game if difficulty selection is valid   // If custom difficulty, also checks for valid inputs
  var validSettings = setGameParameters();
  if( validSettings === "000" ) {
    $('#settings-modal').modal( 'hide' );
    newGameTiles();
    generateMines();
    setDisplayElements();
    setTileClickHandlers();
    setSmileyClickHandlers();
    $('#smiley-icon').removeClass();
    $('#smiley-icon').addClass( 'smiley-icon img-smiley' );
  }
  else {
    // Outlines invalid inputs in red
    if( validSettings[0] === '1' ) $('#input-height').addClass( 'border border-danger' );
    else $('#input-height').removeClass( 'border border-danger' );
    if( validSettings[1] === '1' ) $('#input-width').addClass( 'border border-danger' );
    else $('#input-width').removeClass( 'border border-danger' );
    if( validSettings[2] === '1' ) $('#input-mines').addClass( 'border border-danger' );
    else $('#input-mines').removeClass( 'border border-danger' );
  }
}

function restartGame() {
  // Restarts the game with the same width and height
  $('#settings-modal').modal( 'hide' );
  setGameParameters();
  newGameTiles();
  generateMines();
  resetDisplayElements();
  $('#smiley-icon').removeClass();
  $('#smiley-icon').addClass( 'smiley-icon img-smiley' );
}

function setGameParameters() {
  // Sets parameters for the game   // Checks inputs if selecting custom difficulty
                                      // "000" -> No inputs are wrong
                                      // "010" -> 2nd input is wrong
                                      // "101" -> 1st and 3rd inputs are wrong
                                      // "111" -> All inputs are wrong
  var inputDiff = $('input[name="diff-sel"]:checked', '#diff-sel').val();
  
  if( inputDiff === 'hard' ) {
    diff = 2;
    height = 16;
    width = 30;
    mines = 99;
  }
  if( inputDiff === 'med' ) {
    diff = 1;
    height = 16;
    width = 16;
    mines = 40;
  }
  if( inputDiff === 'easy' ) {
    diff = 0;
    height = 9;
    width = 9;
    mines = 10;
  }
  if( inputDiff === 'easy' || inputDiff === 'med' || inputDiff === 'hard' ) {
    playingStatus = 'playing';
    firstClick = true;
    clearInterval( timerInterval );
    timerStarted = false;
    currentMines = mines;
    timer = 0;
    return "000";    
  }
  else if( inputDiff === 'custom' ) {
    height = parseInt( $('#input-height').val(), 10 );
    width  = parseInt( $('#input-width' ).val(), 10 );
    mines  = parseInt( $('#input-mines' ).val(), 10 );
    
    var wrongString = '';
    if( isNaN(height) || height <= 0 ) wrongString += '1';
    else wrongString += '0';
    if( isNaN(width)  || width <= 0  ) wrongString += '1';
    else wrongString += '0';
    if( isNaN(mines)  || mines <= 0  ) wrongString += '1';
    else if( mines >= width*height ) wrongString += '1';
    else wrongString += '0';
    
    if( wrongString === '000' ) {
      diff = -1;
      playingStatus = 'playing';
      firstClick = true;
      clearInterval( timerInterval );
      timerStarted = false;
      currentMines = mines;
      timer = 0;
    }
      return wrongString;
  }
  return "111";
}

function newGameTiles() {
  // New empty game field
  gameTiles = [];
  shownTiles = [];
  for( var i = 0; i < width; i++ ) {
    var row = [];
    for( var j = 0; j < height; j++ ) {
      row.push( 0 );
    }
    gameTiles.push( row.slice() );
    shownTiles.push( row.slice() );
  }
}

function incrementMineIndicator( xPos, yPos ) {
  // Updates the mine-count around an ( x, y ) position
  // These are the numbers that show how many mines are around itself
  for( var x = xPos-1; x <= xPos+1; x++ ) {
    for( var y = yPos-1; y <= yPos+1; y++ ) {
      if( x >= 0 && y >= 0 && x < width && y < height ) {
        if( gameTiles[x][y] !== -1 ) gameTiles[x][y]++;
      }
    }
  }
}

function decrementMineIndicator( xPos, yPos ) {
  // Called after a Mine is repositioned ( First click can't be a Mine )
  // Updates the mine-count around an ( x, y ) position
  var mineIndicator = 0;
  for( var x = xPos-1; x <= xPos+1; x++ ) {
    for( var y = yPos-1; y <= yPos+1; y++ ) {
      if( x >= 0 && y >= 0 && x < width && y < height ) {
        if( gameTiles[x][y] !== -1 ) {
          gameTiles[x][y]--;
          if( gameTiles[x][y] < 0 ) gameTiles[x][y] = 0;
        }
        else {
          mineIndicator++;
        }
      }
    }
  }
  gameTiles[xPos][yPos] = mineIndicator;
}

function generateMines() {
  var numMines = mines;
  while( numMines > 0 ) {
    var randX = Math.floor( Math.random() * width );
    var randY = Math.floor( Math.random() * height );
    if( gameTiles[randX][randY] !== -1 ) {
      gameTiles[randX][randY] = -1
      incrementMineIndicator( randX, randY );
      numMines--;
    }
  }
}

function repositionMine( xPos, yPos ) {
  gameTiles[xPos][yPos] = 0;
  while( true ) {
    var randX = Math.floor( Math.random() * width );
    var randY = Math.floor( Math.random() * height );
    if( gameTiles[randX][randY] !== -1 && !( randX === xPos && randY === yPos ) ) {
      gameTiles[randX][randY] = -1
      incrementMineIndicator( randX, randY );
      decrementMineIndicator( xPos, yPos );
      return;
    }
  }
}

function clickTile( xPos, yPos ) {
  // Handles events after clicking a specific tile at an ( x, y ) position
  // Can only click if the tile is unrevealed, or unknown ( user's set a question mark on a tile )
  if( playingStatus !== 'playing' ) return;
  if( shownTiles[xPos][yPos] === 0 || shownTiles[xPos][yPos] === 3 ) {
    if( !timerStarted ) {
      timerStarted = true;
      timerInterval = setInterval( function() {
          timer++;
          if( timer > 999 ) timer = 999;
          updateTimerDisplay();
      }, 1000 );
    }
    revealTile( xPos, yPos );
    if( checkWin() ) win();
  }
}

function rightClickTile( xPos, yPos ) {
  // Handles events after right-clicking
  if( playingStatus !== 'playing' ) return;
  if( !timerStarted ) {
    timerStarted = true;
    timerInterval = setInterval( function() {
        timer++;
        if( timer > 999 ) timer = 999;
        updateTimerDisplay();
    }, 1000 );
  }
  if( shownTiles[xPos][yPos] === 0 ) {        // No Mark -> Flagged
    shownTiles[xPos][yPos] = 2;
    currentMines--;
    updateFlagCountDisplay();
    if( checkWin() ) win();
  }
  else if( shownTiles[xPos][yPos] === 2 ) {   // Flagged -> Question Mark
    shownTiles[xPos][yPos] = 3;
    currentMines++;
    updateFlagCountDisplay();
  }
  else if( shownTiles[xPos][yPos] === 3 ) {   // Question Mark -> No Mark
    shownTiles[xPos][yPos] = 0;
  }
  updateTileDisplay( xPos, yPos );
}

function doubleClickTile( xPos, yPos ) {
  // Handles a double click on a Revealed tile
  // Reveals surrounding tiles based on surrounding flags
  // Reveals only if it's number matches the amount of flags surrounding it
  // Can lose the game if flags are incorrect
  if( playingStatus !== 'playing' ) return;
  if( shownTiles[xPos][yPos] !== 1 ) return;
  var flagCount = 0;
  for( var x = xPos-1; x <= xPos+1; x++ ) {
    for( var y = yPos-1; y <= yPos+1; y++ ) {
      if( x >= 0 && y >= 0 && x < width && y < height ) {
        if( shownTiles[x][y] === 2 ) flagCount++;
      }
    }
  }
  if( gameTiles[xPos][yPos] !== flagCount ) return;
  for( var x = xPos-1; x <= xPos+1; x++ ) {
    for( var y = yPos-1; y <= yPos+1; y++ ) {
      if( x >= 0 && y >= 0 && x < width && y < height ) {
        if( shownTiles[x][y] === 0 ) revealTile( x, y );
      }
    }
  }
  if( playingStatus === 'playing' ) {
    if( checkWin() ) win();
  }
}

function revealTile( xPos, yPos ) {
  if( gameTiles[xPos][yPos] === -1 ) {
    if( firstClick ) {
      repositionMine( xPos, yPos );
      revealTile( xPos, yPos );
      firstClick = false;
    }
    else {
      lose();
      shownTiles[xPos][yPos] = -1;
      updateTileDisplay( xPos, yPos );
    }
  }
  else {
    firstClick = false;
    shownTiles[xPos][yPos] = 1;
    updateTileDisplay( xPos, yPos );
    if( gameTiles[xPos][yPos] === 0 ) {   // Reveal all surrounding tiles if this tile is a Zero
      for( var x = xPos-1; x <= xPos+1; x++ ) {
        for( var y = yPos-1; y <=yPos+1; y++ ) {
          if( x >= 0 && y >= 0 && x < width && y < height ) {
            if( shownTiles[x][y] !== 1 ) { revealTile( x, y ); }
          }
        }
      }
    }
  }
}

function lose() {
  // Handles game loss after clicking a bomb
  playingStatus = 'lose';
  timerStarted = false;
  clearInterval( timerInterval );
  for( var x = 0; x < width; x++ ) {
    for( var y = 0; y < height; y++ ) {
      if( gameTiles[x][y] === -1 && shownTiles[x][y] !== 2 ) {        // Reveal all bombs that weren't flagged
        shownTiles[x][y] = -2;
        updateTileDisplay( x, y );
      }
      else if( gameTiles[x][y] !== -1 && shownTiles[x][y] === 2 ) {   // Show which flags were marked incorrectly
        shownTiles[x][y] = -3;
        updateTileDisplay( x, y );
      }
    }
  }
  $('#smiley-icon').removeClass();
  $('#smiley-icon').addClass( 'smiley-icon img-smiley-lose' );
}

function checkWin() {
  // User wins if all mines are flagged, or if all non-mine tiles are revealed
  var flaggedAllMines = true;
  var foundAllNonMines = true;
  for( var x = 0; x < width; x++ ) {
    for( var y = 0; y < height; y++ ) {
      if( gameTiles[x][y] === -1 && shownTiles[x][y] !== 2 ) { flaggedAllMines = false; }
      if( gameTiles[x][y] !== -1 && shownTiles[x][y] !== 1 ) { foundAllNonMines = false; }
    }
  }
 return ( flaggedAllMines || foundAllNonMines );
}

function win() {
  playingStatus = 'win';
  currentMines = 0;
  timerStarted = false;
  clearInterval( timerInterval );
  for( var x = 0; x < width; x++ ) {
    for( var y = 0; y < height; y++ ) {
      if( gameTiles[x][y] === -1 && shownTiles[x][y] !== 2 ) {        // Flag all unrevealed bombs
        shownTiles[x][y] = 2;
        updateTileDisplay( x, y );
      }
      else if( gameTiles[x][y] !== -1 && shownTiles[x][y] !== 1 ) {   // Reveal all other tiles
        shownTiles[x][y] = 1;
        updateTileDisplay( x, y );
      }
    }
  }
  $('#smiley-icon').removeClass();
  $('#smiley-icon').addClass( 'smiley-icon img-smiley-win' );
}

function updateTimerDisplay() {
  var timerCopy = timer;
  // Ones place
  $('#timer1').removeClass();
  $('#timer1').addClass( 'menu-num' );
  $('#timer1').addClass( 'menu' + parseInt(timerCopy%10) );
  // Tens place
  timerCopy /= 10;
  $('#timer10').removeClass();
  $('#timer10').addClass( 'menu-num' );
  $('#timer10').addClass( 'menu' + parseInt(timerCopy%10) );
  // Hundreds place
  timerCopy /= 10;
  $('#timer100').removeClass();
  $('#timer100').addClass( 'menu-num' );
  $('#timer100').addClass( 'menu' + parseInt(timerCopy%10) );
}

function updateFlagCountDisplay() {
  var mineCopy = currentMines;
  if( mineCopy < 0 ) mineCopy = 0;
  // Ones place
  $('#mines1').removeClass();
  $('#mines1').addClass( 'menu-num' );
  $('#mines1').addClass( 'menu' + parseInt(mineCopy%10) );
  // Tens place
  mineCopy /= 10;
  $('#mines10').removeClass();
  $('#mines10').addClass( 'menu-num' );
  $('#mines10').addClass( 'menu' + parseInt(mineCopy%10) );
  // Hundreds place
  mineCopy /= 10;
  $('#mines100').removeClass();
  $('#mines100').addClass( 'menu-num' );
  $('#mines100').addClass( 'menu' + parseInt(mineCopy%10) );
}

function setDisplayElements() {
  $('#game-container').width( width*16 + 17 );
  $('#game-body').height( height*16 + 2);
  
  var gameElements = '';
  
  for( var x = 0; x < width; x++ ) {
    gameElements += '<div class="game-body-col">';
    for( var y = 0; y < height; y++ ) {
      gameElements += '<div id="'+x+'_'+y+'"class="game-square game-block"></div>'
    }
    gameElements += '</div>'
  }
  $('#game-body').html( gameElements );
  updateFlagCountDisplay();
  updateTimerDisplay();
}

function resetDisplayElements() {
  // Resets all Tiles to be shown as unrevealed
  for( x = 0; x < width; x++ ) {
    for( y = 0; y < height; y++ ) {
      $('#'+x+'_'+y).removeClass();
      $('#'+x+'_'+y).addClass( 'game-square game-block' );
    }
  }
  updateFlagCountDisplay();
  updateTimerDisplay();
}

function setTileClickHandlers() {
  // Set Left and Right clicks for each game tile
  for( var x = 0; x < width; x++ ) {
    for( var y = 0; y < height; y++ ) {
      (function( xPos, yPos ) {
        $('#'+xPos+'_'+yPos).on( 'click', function(e) {    // Left Click
          e.preventDefault();
          if( playingStatus === 'playing' ) {
            $('#smiley-icon').removeClass();
            $('#smiley-icon').addClass( 'smiley-icon img-smiley' );
          }
          clickTile( xPos, yPos );
        })
        .on( 'dblclick', function() {
          doubleClickTile( xPos, yPos );
        })
        .on( 'mouseleave', function() {
          if( shownTiles[xPos][yPos] === 0 ) {
            $(this).removeClass();
            $(this).addClass( 'game-square game-block' );
          }
          else if( shownTiles[xPos][yPos] === 3 ) {
            $(this).removeClass();
            $(this).addClass( 'game-square game-unknown' );
          }
          if( playingStatus === 'playing' ) {
            $('#smiley-icon').removeClass();
            $('#smiley-icon').addClass( 'smiley-icon img-smiley' );
          }
        })
        .contextmenu( function() {    // Prevent default of Right-clicks
            return false;
        })
        .mousedown( function(e) {
          e.preventDefault();
          if( playingStatus === 'playing' ) {
            if( e.which === 1 ) {       // Add tile pressed animation, including smiley-icon animation
              if( shownTiles[xPos][yPos] === 0 ) {
                $(this).removeClass();
                $(this).addClass( 'game-square game-block-pressed' );
              }
              else if( shownTiles[xPos][yPos] === 3 ) {
                $(this).removeClass();
                $(this).addClass( 'game-square game-unknown-pressed' );
              }
              $('#smiley-icon').removeClass();
              $('#smiley-icon').addClass( 'smiley-icon img-smiley-action' );
            }
            else if( e.which === 3 ) {        // Add right-click handler
              rightClickTile( xPos, yPos );
            }
          }
        });
      })( x, y );
    }
  }
}

function setSmileyClickHandlers() {
  // Set click handler for Smiley Face
  $('#smiley-icon')
  .on( 'mousedown', function(e) {
    e.preventDefault();
    $(this).removeClass();
    $(this).addClass( 'smiley-icon img-smiley-pressed' );
  })
  .on ( 'mouseleave', function() {
    if( playingStatus === 'playing' ) {
      $(this).removeClass();
      $(this).addClass( 'smiley-icon img-smiley' );
    }
    else if( playingStatus === 'lose' ) {
      $(this).removeClass();
      $(this).addClass( 'smiley-icon img-smiley-lose' );
    }
    else if( playingStatus === 'win' ) {
      $(this).removeClass();
      $(this).addClass( 'smiley-icon img-smiley-win' );
    }
  })
  .on( 'click', function() {
    restartGame();
  });
}

function updateTileDisplay( xPos, yPos ) {
  var displayClasses = "game-square";
  if     ( shownTiles[xPos][yPos] === -3 ) displayClasses += " game-bomb-wrong";
  else if( shownTiles[xPos][yPos] === -2 ) displayClasses += " game-bomb";
  else if( shownTiles[xPos][yPos] === -1 ) displayClasses += " game-bomb-red";
  else if( shownTiles[xPos][yPos] ===  0 ) displayClasses += " game-block";
  else if( shownTiles[xPos][yPos] ===  1 ) displayClasses += " game-num" + gameTiles[xPos][yPos];
  else if( shownTiles[xPos][yPos] ===  2 ) displayClasses += " game-flag";
  else if( shownTiles[xPos][yPos] ===  3 ) displayClasses += " game-unknown";
  $('#'+xPos+'_'+yPos).removeClass();
  $('#'+xPos+'_'+yPos).addClass( displayClasses );
}

$( 'document' ).ready( function() {
  startGame();
  
  $('#new-game-button').on( 'click', startGame );
  
  $('.input-settings').on( 'focus', function() {
    $('#diff-custom').attr( 'checked', true );
  });
  
});