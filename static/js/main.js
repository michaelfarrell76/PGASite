var REFRESH_RATE = 12000;


//Update the chat screen
function updateScores() {
  success = function(messages) {
    $("td#leaderboard").parent().replaceWith(messages[0]);
    $("td#scoreboard").parent().replaceWith(messages[1]);
    document.getElementById("refresh").innerHTML = messages[2];
    }
  
  $.ajax({
      type: "POST",
      dataType: "json",
      url: 'get_data',
      data: {},
      success: success
    });
}

$(document).ready(function(){
  //should only do these for specific pages
  updateScores();
  
  
});

//how often we update the users
window.setInterval(function(){
  updateScores();
}, REFRESH_RATE);

