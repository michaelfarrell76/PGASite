var user_int = 50000;
var chat_int = 1000;
var global_user_count = 0;

var current_chatting_id = -1;
var global_latest_message_id = 0;
var minimized = MINIMIZED == 1;

var current_graph



function updateUsers(){
    success = function(users) {
      var num_users = users.length

      if (num_users > global_user_count) {
        global_user_count = num_users
        latest_user_id = users[0][0]
        users_out = []
        for (var i = 0; i < num_users; i++) { 
          user = users[i]
          if (user[0] >= latest_user_id) {
            user_data = {}
            user_data.user_id = user[0]
            user_data.name = user[1]
            users_out.push(user_data)
          }
          else {
            break
          }
        }
        users_out.reverse()
        $('#users').find('li').empty()
        for (var i = 0; i < users_out.length; i++) {
          name = users_out[i].name;
          user_id = users_out[i].user_id;
          $("#users ul").append('<li><a href="#" id="user' + user_id + '">' + name + '</a></li>');
         
          $( "#user" + user_id ).click(function() {
            if (user_id != current_chatting_id){
               $('#user_chatting').empty().html(name);
              current_chatting_id = user_id;
              global_latest_message_id = 0;
              $('#messaging_space').find('li').empty()
              updateChat();
            }
          });
        }
      }
    }
    data = {format:'json'}
    a = $.ajax({
      dataType: "json",
      url: "get_users",
      data: data,
      success: success
    });
}

//Update the chat screen
function updateChat() {
  success = function(messages) {

    var messages_len = messages.length
    if(messages == ''){
      newest_message_id = 0
    }
    else{
      newest_message_id = messages[0][0]
    }
    if (newest_message_id > global_latest_message_id) {
      last_message_id = global_latest_message_id
      global_latest_message_id = newest_message_id
      messages_out = []

      for (var i = 0; i < messages_len; i++) { 
        message = messages[i]
        if ( message[0] > last_message_id) {
          message_data = {}
          message_data.latest_id = message[0]
          message_data.name = message[1]
          message_data.message = message[2] 
          messages_out.push(message_data)
        }
        else {
          break
        }
      }

      messages_out.reverse()
      for (var i = 0; i < messages_out.length; i++) {
        name = messages_out[i].name;
        message = messages_out[i].message;
        $("#messaging_space ul").append('<li>' + name + ': ' + message + '</a></li>');
      }
    }
  }
  if (current_chatting_id != -1){
    data = {other_user: cleanInput(current_chatting_id),
            select_type: 'user'}

    $.ajax({
      type: "POST",
      dataType: "json",
      url: 'get_messages',
      data: data,
      success: success
    });
  }
}

// Keyboard events
$(window).keydown(function (event) {

  // When the client hits ENTER on their keyboard
  if (event.which === 13) {

    if (!minimized && current_chatting_id != -1) {
      
      var message = $('#main_chatbox').val();
      if(message != "" && message != "\n"){
        sendMessage(message);
        $('#main_chatbox').val('');
      }
    }
  }
});

function collapseChat() {
    current_height = $("div.chat > div.chatArea").css("height");
    if (minimized) {
      $("div.chat > div.chatArea").css("height", 250);
      $("div.chat > div.chatArea").css("padding", ".25rem .65rem");
      $("div.chat > div.chatArea").css("visibility", "visible");

      $("textarea").css("visibility", "visible");
      $("textarea").css("height", 40);
    }
    else{
      $("div.chat > div.chatArea").css("height", 0);
      $("div.chat > div.chatArea").css("padding", "0rem 0rem");
      $("div.chat > div.chatArea").css("visibility", "hidden");

      $("textarea").css("visibility", "hidden");
      $("textarea").css("height", 0);
    }
    minimized = !minimized;
    $.post("minimize", {minimized:minimized})

  }

// Sends a chat message
function sendMessage (message) {

  if (current_chatting_id != -1){
    var data = {message:message, 
                other_user: cleanInput(current_chatting_id),
                select_type: 'user'}
    $.post("send_message", data)
  }
  updateChat();
  updateUsers();  
}

function setup_chat(){
  updateUsers();
  $( "#chat_min" ).click(collapseChat);
  if (minimized){
    $("div.chat > div.chatArea").css("height", 0);
    $("div.chat > div.chatArea").css("padding", "0rem 0rem");
    $("div.chat > div.chatArea").css("visibility", "hidden");

    $("textarea").css("visibility", "hidden");
    $("textarea").css("height", 0);
  }
}

function setup_myprofile(){
  $('#manage_tracked_portfolios').on("click",function(){
    $('#edit_info_space').hide();
    $('#manage_notifications_space').hide();

    $('#track_portfolios_space').show();

    $('#manage_tracked_portfolios').toggleClass('active');

    $('#edit_info').removeClass('active');
    $('#manage_notifications').removeClass('active');
  })

  $('#edit_info').on("click",function(){
    $('#track_portfolios_space').hide();
    $('#manage_notifications_space').hide();

    $('#edit_info_space').show();

    $('#edit_info').toggleClass('active');
    
    $('#manage_tracked_portfolios').removeClass('active');
    $('#manage_notifications').removeClass('active');


  })

  $('#manage_notifications').on("click",function(){
    $('#track_portfolios_space').hide();
    $('#edit_info_space').hide();

    $('#manage_notifications_space').show();

    $('#manage_notifications').toggleClass('active');
    
    $('#edit_info').removeClass('active');
    $('#manage_tracked_portfolios').removeClass('active');
  })
}


function success_graph(data){
  current_graph.destroy()
  labels = data[0]
  dataset = data[1]
  graph(labels, dataset, "portfolio_plot");
  $('.load_sp').hide();
}

function failure_graph(data){
  alert('failed to get graph data')
}

function date_to_string(date_obj){
  return (('0' + (date_obj.getMonth()+1)).slice(-2) + '/' + ('0' + date_obj.getDate()).slice(-2)  + '/' + date_obj.getFullYear())
}

function setup_datepickers(){
  var today = new Date();
  var today_str = date_to_string(today)
  var yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  var yesterday_str =  date_to_string(yesterday)
    
  $('#datepicker_end').datepicker({
      format: "mm/dd/yyyy",
  });  
  $('#datepicker_start').datepicker({
      format: "mm/dd/yyyy",
  });  

  var year_ago = new Date();
  year_ago.setDate(today.getDate() - 365);
  var year_ago_str = date_to_string(year_ago)

   var three_month = new Date();
  three_month.setDate(today.getDate() - 90);
  var three_month_str = date_to_string(three_month)



  $("#datepicker_end").val( today_str);
  $("#datepicker_start").val( three_month_str);

}

function request_plot(){
  var start_dt = $("#datepicker_start").val();
  var end_dt = $("#datepicker_end").val();

  $('.load_sp').show();

  data = {start_dt : start_dt,
            end_dt : end_dt};

  $.ajax({
    type: "POST",
    dataType: "json",
    url: '/',
    data: data,
    success: success_graph, 
    failure: failure_graph
  });

}




function setup_portfolio(){
  graph([1,2,3,4], [1,2,3,4], "portfolio_plot");
  setup_datepickers();
  request_plot();

  $("#updateGraph").click(function () {
    request_plot();
  });  
}


$(document).ready(function(){
  setup_chat();

  //should only do these for specific pages
  setup_myprofile();

  setup_portfolio();
  
  
});



function graph(labels, datasets, id){

  var ctx = $("#" + id).get(0).getContext("2d");
  var data = {

    labels: labels,
    datasets: [
        {
            label: "My First dataset",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: datasets
        },
        // {
        //     label: "My Second dataset",
        //     fillColor: "rgba(151,187,205,0.2)",
        //     strokeColor: "rgba(151,187,205,1)",
        //     pointColor: "rgba(151,187,205,1)",
        //     pointStrokeColor: "#fff",
        //     pointHighlightFill: "#fff",
        //     pointHighlightStroke: "rgba(151,187,205,1)",
        //     data: [28, 48, 40, 19, 86, 27, 90]
        // }
    ]
  };
  var options = {
    bezierCurve: false,
    pointHitDetectionRadius : 3,
    maintainAspectRatio: true,
    responsive: false
  }
  current_graph = new Chart(ctx).Line(data, options);
  ctx.canvas.width = 650;
  ctx.canvas.height = 500;
}

// Prevents input from having injected markup
function cleanInput (input) {
  return $('<div/>').text(input).text();
}

//how often we update the users
window.setInterval(function(){
  updateUsers();
}, user_int);

// how often we update the users
window.setInterval(function(){
  updateChat();
}, chat_int);