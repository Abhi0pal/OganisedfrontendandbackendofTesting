$(window).on('scroll', function () {
  if ($(this).scrollTop() > 50) { // adjust scroll value as needed
    $('body').addClass('sticky-header');
    $('.main-header').addClass('sticky');
  } else {
    $('body').removeClass('sticky-header');
    $('.main-header').removeClass('sticky');
  }
});

/* 
-------------------------------------------------------------------
------------------- Carousel : Content Control --------------------
-------------------------------------------------------------------
*/
const myCarouselEl = document.querySelector('#carouselExampleIndicators');
const carousel = new bootstrap.Carousel(myCarouselEl, {
  interval: 3000,
  wrap: true
});

function changeBannerOnNav(idx) {
  $('.banner-content-wrap .b-txt').addClass('d-none').removeClass('d-block');
  $('#slier-' + idx).removeClass('d-none').addClass('d-block');
  if (carousel) carousel.to(idx);
}

myCarouselEl.addEventListener('slid.bs.carousel', function (e) {
  const newIndex = typeof e.to === 'number' ? e.to : 0;
  $('.banner-content-wrap .b-txt').addClass('d-none').removeClass('d-block');
  $('#slier-' + newIndex).removeClass('d-none').addClass('d-block');
});

/* 
-------------------------------------------------------------------
------------------ News Ticker : Under Carousel -------------------
-------------------------------------------------------------------
*/
jQuery(function($){ 
    $(".newsticker").each(function(ix, ex){
        var $tickerWrapper = $(ex);
        var $list = $tickerWrapper.find(".ticker-wrap");
        var $clonedList = $list.clone();
        var listWidth = 10;

        $list.find("a").each(function (i) {
                    listWidth += $(this, i).outerWidth(true);
        });

        var endPos = $tickerWrapper.width() - listWidth;

        $list.add($clonedList).css({
            "width" : listWidth + "px"
        });

        $clonedList.addClass("cloned").appendTo($tickerWrapper);

        //TimelineMax
        var infinite = new TimelineMax({repeat: -1, paused: true});
        var time = 50;

        infinite
            .fromTo($list, time, {rotation:0.01,x:0}, {force3D:true, x: -listWidth, ease: Linear.easeNone}, 0)
            .fromTo($clonedList, time, {rotation:0.01, x:listWidth}, {force3D:true, x:0, ease: Linear.easeNone}, 0)
            .set($list, {force3D:true, rotation:0.01, x: listWidth})
            .to($clonedList, time, {force3D:true, rotation:0.01, x: -listWidth, ease: Linear.easeNone}, time)
            .to($list, time, {force3D:true, rotation:0.01, x: 0, ease: Linear.easeNone}, time)
            .progress(1).progress(0)
            .play();

        //Pause/Play        
        $tickerWrapper.on("mouseenter", function(){
            infinite.pause();
        }).on("mouseleave", function(){
            infinite.play();
        });
    });    			
});

/* 
-------------------------------------------------------------------
----------------------- District Wise Map -------------------------
-------------------------------------------------------------------
*/
var stateData = {
		// Dehradun
		state1: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Bakery products and Mushroom</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Bakery</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/dehradun.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Bakery</p>"
		],

		// Uttarkashi
		state2: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Apple base products and Red Rice</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Red Rice</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/uttarkashi.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Red Rice</p>"
		],

		// Chamoli
		state3: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Rose Water, Handloom Products and Carpet</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Fish based products</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/chamoli.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Nettle Products</p>"
		],

		// Haridwar
		state4: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Honey and Jaggery</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Mushroom</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/haridwar.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Jaggery</p>"
		],

		// Tehri Garhwal
		state5: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Paneer and Tehri Nath</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Ginger based product</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/tehri.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tagst</strong><p>Nettle Products</p>"
		],

		// Rudraprayag
		state6: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Choulai based product and Temple Imitation Products</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Amaranthas based products (Laddu)</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/rudraprayag.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Temple Imitation (Wood Craft)</p>"
		],

		// Pauri Garhwal
		state7: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Herbal Medicine and Wooden Crafts</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Herbal Products</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/pauri.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Natural Fibre Products</p>"
		],

		// Almora
		state8: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Baal Mithai and Handloom (Almora Tweed)</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Bal Mithai</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/almora.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Bal Mithai</p>"
		],

		// Nainital
		state9: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Aipan Craft and Fruit Processing</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Aipan Product</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/nainital.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Aipan Product</p>"
		],

		// Udham Singh Nagar
		state10: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Mentha Oil and Moonj Grass Products</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Moonj Grass Products</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/udhamsinghnagar.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Moonj Grass Products</p>"
		],

		// Bageshwar
		state11: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Copper based products and Kiwi based products</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Copper Products</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/bageshwar.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Copper Products</p>"
		],

		// Pithoragarh
		state12: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Munsyari Rajma and Woollen Carpets</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Woollen Products</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/pithoragarh.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Woollen Products</p>"
		],

		// Champawat
		state13: [
			"<strong class='d-block mb-2'>ODTP</strong><p>Honey and Iron based products</p>",
			"<strong class='d-block mb-2'>ODOP</strong><p>Himalayan Honey</p>",
            "<strong class='d-block mb-2'>Major Export</strong><a href='https://preprodinvestuttarakhand.com/uat_swcs/ExportUK/district-wise-data/champawat.php' target='_blank'>View Dashboard</a>",
			"<strong class='d-block mb-2'>GI Tags</strong><p>Himalayan Honey</p>"
		]
	};

// Function to update records based on selected state
function updateRecords(stateId, stateImg) {
	var records = stateData[stateId] || [], container = $("#records-container").empty();
	if (records.length) {
		container.append(`<div class='row'><div class='col-sm-12'><img src='img/districts/${stateImg}.jpg' class='d-block ms-0 rounded-4 img-fluid wow bounceIn' data-wow-duration='0.5s' data-wow-delay='0.0s'></div></div>`);
		var row = $("<div>").addClass("row");
		records.forEach((record, i) => row.append(`<div class='text-start col-sm-6 mt-4'><div class='pd-box wow bounceIn' data-wow-duration='0.8s' data-wow-delay='${0.2 + i * 0.2}s'>${record}</div></div>`));
		container.append(row);
	} else container.append(`<p>No records available for ${stateId}.</p>`);
}

$(".state").on("click", function () {
	var id = $(this).attr("id"), img = $(this).attr("data-image");
	$(".state, .statename").removeClass("active"), $(this).addClass("active"), $(this).next().addClass("active");
	updateRecords(id, img);
});

$('#state1').click(); 

// ======== Bootstrap Modal ========
  const modalEl = document.getElementById('speechModal');
  const modal = new bootstrap.Modal(modalEl);

  function openModal() {
    modal.show();
  }

  // ======== Speech Recognition Setup ========
  const transcriptDisplay = document.getElementById('transcriptDisplay');
  const toggleBtn = document.getElementById('toggleBtn');

  let isListening = false;
  let recognition;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      toggleBtn.textContent = 'Stop';
      transcriptDisplay.textContent = 'Listening...';
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      transcriptDisplay.textContent = transcript;
      handleCommand(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      toggleBtn.textContent = 'Start';
      transcriptDisplay.textContent = 'Click to speak';
    };

    recognition.onend = () => {
      isListening = false;
      toggleBtn.textContent = 'Start';
      if (!transcriptDisplay.textContent) {
        transcriptDisplay.textContent = 'Click to speak';
      }
    };
  } else {
    toggleBtn.disabled = true;
    transcriptDisplay.textContent = 'Speech recognition not supported in this browser';
  }

  // ======== Toggle Listening ========
  toggleBtn.addEventListener('click', () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      transcriptDisplay.textContent = '';
      recognition.start();
    }
  });

  // ======== Handle Commands ========
function handleCommand(command) {
  console.log('Heard command:', command);

  if (command.includes('login') || command.includes('sign in')) {
    window.location.href = 'https://preprodinvestuttarakhand.com/uat_swcs/swcs/sample/one/action/signin';
  } else if (command.includes('back') || command.includes('previous')) {
    window.history.back();
  } else if (command.includes('register') || command.includes('sign up') || command.includes('registration')) {
    window.location.href = 'https://preprodinvestuttarakhand.com/uat_swcs/sso/account/register';
  }  else if (command.includes('about') || command.includes('about page') || command.includes('details')) {
    window.location.href = 'about.html';
  } else {
    alert(`Command not recognized: "${command}"`);
  }
}

// Investor Journey
/*$(document).on('click', '.stop', function(e) {
  e.preventDefault();

  var $wrap = $(this).closest('.highway-wrap');
  var $col = $(this).closest('.col-md-4');
  var $target = $col.find('.journey-point');

  if (!$target.length) {
    $target = $(this).closest('.journey-point');
  }

  $wrap.find('.journey-point').removeClass('active');
  $target.addClass('active');

  var idx = $wrap.find('.col-md-4').index($col);
  var levelClass = 'level-' + (idx + 1);
  var $truck = $wrap.find('.truck');

  $truck.removeClass(function(i, classes) {
    return (classes.match(/\blevel-\d+/g) || []).join(' ');
  }).addClass(levelClass);
});*/
$(document).ready(function () {
  var $wrap = $('.highway-wrap');
  var $cols = $wrap.find('.col-md-4');
  var $truck = $wrap.find('.truck');
  var currentIndex = 0;

  function moveTruck() {
    var $col = $cols.eq(currentIndex);
    var $target = $col.find('.journey-point');

    $wrap.find('.journey-point').removeClass('active');
    $target.addClass('active');

    var levelClass = 'level-' + (currentIndex + 1);
    $truck.removeClass(function (i, classes) {
      return (classes.match(/\blevel-\d+/g) || []).join(' ');
    }).addClass(levelClass);

    currentIndex = (currentIndex + 1) % $cols.length;
  }

  moveTruck();
  setInterval(moveTruck, 2000); // run every 2 seconds
});


// Focus Sector
$(document).on('click', '.energy', function(e) { 
  e.preventDefault(); 

  if($(this).hasClass('last')){ 

    $('.healthcare').addClass('hide-ctr'); 
    $('.healthcare').removeClass('hide-lft'); 

    $('.industry').addClass('hide-lft'); 
    $('.industry').removeClass('first'); 

    $('.agri').addClass('first');
    $('.agri').removeClass('current'); 

    $(this).addClass('current'); 
    $(this).removeClass('last'); 

    $('.tourism').addClass('last'); 
    $('.tourism').removeClass('hide-rgt'); 

    $('.education').addClass('hide-rgt'); 
    $('.education').removeClass('hide-ctr'); 

  }else if($(this).hasClass('first')){ 

    $('.healthcare').addClass('hide-ctr'); 
    $('.healthcare').removeClass('hide-rgt'); 

    $('.industry').addClass('hide-lft'); 
    $('.industry').removeClass('hide-ctr'); 

    $('.agri').addClass('first'); 
    $('.agri').removeClass('hide-lft'); 

    $(this).addClass('current'); 
    $(this).removeClass('first'); 

    $('.tourism').addClass('last'); 
    $('.tourism').removeClass('current'); 

    $('.education').addClass('hide-rgt'); 
    $('.education').removeClass('last'); 

  } 

  $('.sector-control h3').text('1st of 6th'); 
  $('.sector-description .sd-box').addClass('d-none'); 
  $('.sector-description .energy-box').removeClass('d-none'); 
  $('.focus-sector .sector-images').addClass('d-none'); 
  $('.focus-sector .energy-image').removeClass('d-none'); });

$(document).on('click', '.tourism', function(e) {
  e.preventDefault();

  if($(this).hasClass('last')){

    $('.industry').addClass('hide-ctr');
    $('.industry').removeClass('hide-lft');

    $('.healthcare').addClass('hide-rgt');
    $('.healthcare').removeClass('hide-ctr');

    $('.agri').addClass('hide-lft');
    $('.agri').removeClass('first');

    $('.energy').addClass('first');
    $('.energy').removeClass('current');

    $(this).addClass('current');
    $(this).removeClass('last');

    $('.education').addClass('last');
    $('.education').removeClass('hide-rgt');

  }else if($(this).hasClass('first')){

    $('.industry').addClass('hide-ctr');
    $('.industry').removeClass('hide-rgt');

    $('.healthcare').addClass('hide-rgt');
    $('.healthcare').removeClass('last');

    $('.agri').addClass('hide-lft');
    $('.agri').removeClass('hide-ctr');

    $('.energy').addClass('first');
    $('.energy').removeClass('hide-lft');

    $(this).addClass('current');
    $(this).removeClass('first');

    $('.education').addClass('last');
    $('.education').removeClass('current');

  }

  $('.sector-control h3').text('2nd of 6th');
  $('.sector-description .sd-box').addClass('d-none');
  $('.sector-description .tourism-box').removeClass('d-none');
  $('.focus-sector .sector-images').addClass('d-none');
  $('.focus-sector .tourism-image').removeClass('d-none');
});

$(document).on('click', '.education', function(e) {
  e.preventDefault();

  if($(this).hasClass('last')){

    $('.healthcare').addClass('last');
    $('.healthcare').removeClass('hide-rgt');

    $('.energy').addClass('hide-lft');
    $('.energy').removeClass('first');

    $('.tourism').addClass('first');
    $('.tourism').removeClass('current');

    $(this).addClass('current');
    $(this).removeClass('last');

    $('.industry').addClass('hide-rgt');
    $('.industry').removeClass('hide-ctr');
    
    $('.agri').addClass('hide-ctr');
    $('.agri').removeClass('hide-lft');

  }else if($(this).hasClass('first')){

    $('.healthcare').addClass('last');
    $('.healthcare').removeClass('current');

    $('.energy').addClass('hide-lft');
    $('.energy').removeClass('hide-ctr');

    $('.tourism').addClass('first');
    $('.tourism').removeClass('hide-lft');

    $(this).addClass('current');
    $(this).removeClass('first');

    $('.industry').addClass('hide-rgt');
    $('.industry').removeClass('last');
    
    $('.agri').addClass('hide-ctr');
    $('.agri').removeClass('hide-rgt');

  }

  $('.sector-control h3').text('3rd of 6th');
  $('.sector-description .sd-box').addClass('d-none');
  $('.sector-description .education-box').removeClass('d-none');
  $('.focus-sector .sector-images').addClass('d-none');
  $('.focus-sector .education-image').removeClass('d-none');
});

$(document).on('click', '.healthcare', function(e) {
  e.preventDefault();

  if($(this).hasClass('last')){
  
    $('.education').addClass('first');
    $('.education').removeClass('current');

    $('.energy').addClass('hide-ctr');
    $('.energy').removeClass('hide-lft');

    $('.tourism').addClass('hide-lft');
    $('.tourism').removeClass('first');

    $(this).addClass('current');
    $(this).removeClass('last');

    $('.industry').addClass('last');
    $('.industry').removeClass('hide-rgt');
    
    $('.agri').addClass('hide-rgt');
    $('.agri').removeClass('hide-ctr');

  }else if($(this).hasClass('first')){
  
    $('.education').addClass('first');
    $('.education').removeClass('hide-lft');

    $('.energy').addClass('hide-ctr');
    $('.energy').removeClass('hide-rgt');

    $('.tourism').addClass('hide-lft');
    $('.tourism').removeClass('hide-ctr');

    $(this).addClass('current');
    $(this).removeClass('first');

    $('.industry').addClass('last');
    $('.industry').removeClass('current');
    
    $('.agri').addClass('hide-rgt');
    $('.agri').removeClass('last');

  }

  $('.sector-control h3').text('4th of 6th');
  $('.sector-description .sd-box').addClass('d-none');
  $('.sector-description .healthcare-box').removeClass('d-none');
  $('.focus-sector .sector-images').addClass('d-none');
  $('.focus-sector .healthcare-image').removeClass('d-none');
});

$(document).on('click', '.industry', function(e) {
  e.preventDefault();

  if($(this).hasClass('last')){

    $('.healthcare').addClass('first');
    $('.healthcare').removeClass('current');

    $('.tourism').addClass('hide-ctr');
    $('.tourism').removeClass('hide-lft');

    $('.education').addClass('hide-lft');
    $('.education').removeClass('first');

    $(this).addClass('current');
    $(this).removeClass('last');

    $('.agri').addClass('last');
    $('.agri').removeClass('hide-rgt');
    
    $('.energy').addClass('hide-rgt');
    $('.energy').removeClass('hide-ctr');

  }else if($(this).hasClass('first')){

    $('.healthcare').addClass('first');
    $('.healthcare').removeClass('hide-lft');

    $('.tourism').addClass('hide-ctr');
    $('.tourism').removeClass('hide-rgt');

    $('.education').addClass('hide-lft');
    $('.education').removeClass('hide-ctr');

    $(this).addClass('current');
    $(this).removeClass('first');

    $('.agri').addClass('last');
    $('.agri').removeClass('current');
    
    $('.energy').addClass('hide-rgt');
    $('.energy').removeClass('last');

  }

  $('.sector-control h3').text('5th of 6th');
  $('.sector-description .sd-box').addClass('d-none');
  $('.sector-description .industry-box').removeClass('d-none');
  $('.focus-sector .sector-images').addClass('d-none');
  $('.focus-sector .industry-image').removeClass('d-none');
});

$(document).on('click', '.agri', function(e) {
  e.preventDefault();

  if($(this).hasClass('last')){

    $('.healthcare').addClass('hide-lft');
    $('.healthcare').removeClass('first');

    $('.education').addClass('hide-ctr');
    $('.education').removeClass('hide-lft');

    $('.industry').addClass('first');
    $('.industry').removeClass('current');

    $(this).addClass('current');
    $(this).removeClass('last');

    $('.energy').addClass('last');
    $('.energy').removeClass('hide-rgt');
    
    $('.tourism').addClass('hide-rgt');
    $('.tourism').removeClass('hide-ctr');

  }else if($(this).hasClass('first')){
  
    $('.healthcare').addClass('hide-lft');
    $('.healthcare').removeClass('hide-ctr');

    $('.education').addClass('hide-ctr');
    $('.education').removeClass('hide-rgt');

    $('.industry').addClass('first');
    $('.industry').removeClass('hide-lft');

    $(this).addClass('current');
    $(this).removeClass('first');

    $('.energy').addClass('last');
    $('.energy').removeClass('current');
    
    $('.tourism').addClass('hide-rgt');
    $('.tourism').removeClass('last');

  }

  $('.sector-control h3').text('6th of 6th');
  $('.sector-description .sd-box').addClass('d-none');
  $('.sector-description .agri-box').removeClass('d-none');
  $('.focus-sector .sector-images').addClass('d-none');
  $('.focus-sector .agri-image').removeClass('d-none');
});