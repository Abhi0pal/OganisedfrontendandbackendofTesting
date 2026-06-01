  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 50) { // adjust scroll value as needed
      $('body').addClass('sticky-header');
    } else {
      $('body').removeClass('sticky-header');
    }
  });

$(function () {
  // ---------- Data ----------
  // Minimal country list for demonstration; expand if you want full ISO list.
  var countries = [
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AS", name: "American Samoa" },
    { code: "AD", name: "Andorra" },
    { code: "AO", name: "Angola" },
    { code: "AI", name: "Anguilla" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "BD", name: "Bangladesh" },
    { code: "BE", name: "Belgium" },
    { code: "BR", name: "Brazil" },
    { code: "CA", name: "Canada" },
    { code: "CN", name: "China" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "IN", name: "India" }, // important for the workflow
    { code: "IT", name: "Italy" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "Korea, Republic of" },
    { code: "MX", name: "Mexico" },
    { code: "NL", name: "Netherlands" },
    { code: "NZ", name: "New Zealand" },
    { code: "RU", name: "Russian Federation" },
    { code: "ZA", name: "South Africa" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "TR", name: "Turkey" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" }
    // Add more countries if you want the full ISO list
  ];

  // All Indian States + Union Territories (label only)
  var indiaStates = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
    "Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir",
    "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
    "Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
    "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
    // Union Territories
    "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep","Delhi","Puducherry","Ladakh"
  ];

  // Uttarakhand districts (13)
  var uttarakhandDistricts = [
    "Almora",
    "Bageshwar",
    "Chamoli",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar",
    "Uttarkashi"
  ];

  // ---------- Helpers ----------
  function populateSelect($select, items, options) {
    // options: {valueIsIndex:false, placeholder:true/false}
    $select.empty();
    if (options && options.placeholder) {
      $select.append('<option selected disabled>Select ' + ($select.attr('aria-label') || 'Option') + '</option>');
    }
    if (!items || items.length === 0) return;
    if (options && options.valueIsIndex) {
      // create option value as index
      items.forEach(function(item, i){
        $select.append('<option value="'+ i +'">'+ item +'</option>');
      });
    } else {
      items.forEach(function(item){
        if (typeof item === 'object') {
          $select.append('<option value="'+ item.code +'">'+ item.name +'</option>');
        } else {
          // simple string
          $select.append('<option value="'+ item +'">'+ item +'</option>');
        }
      });
    }
    // enable the select
    $select.prop('disabled', false);
  }

  function clearSelect($select) {
    $select.empty();
    $select.append('<option selected disabled>Select ' + ($select.attr('aria-label') || 'Option') + '</option>');
    $select.prop('disabled', true);
  }

  // initialize: states & district disabled
  var $country = $('#countrySelect'),
      $state = $('#stateSelect'),
      $district = $('#districtSelect');

  clearSelect($state);
  clearSelect($district);

  // ---------- Events ----------
  // Populate countries on first focus/click (lazy load)
  $country.one('focus click', function () {
    populateSelect($country, countries, { placeholder: true });
  });

  // When a country is chosen
  $country.on('change', function () {
    var selectedCode = $(this).val();
    var selectedText = $(this).find('option:selected').text();

    // Reset downstream selects
    clearSelect($state);
    clearSelect($district);

    if (selectedCode === 'IN' || selectedText.toLowerCase().indexOf('india') !== -1) {
      // Populate states for India
      populateSelect($state, indiaStates, { placeholder: true });
      // Optionally auto-select Uttarakhand for demo; commented out
      // $state.val('Uttarakhand').trigger('change');
    } else {
      // If not India, you can optionally load other-country-specific subdivisions or leave disabled
      // Keeping it disabled by default
    }
  });

  // When a state is chosen
  $state.on('change', function () {
    var state = $(this).val();

    // Reset district
    clearSelect($district);

    if (state === 'Uttarakhand' || state.toLowerCase().indexOf('uttarakhand') !== -1) {
      populateSelect($district, uttarakhandDistricts, { placeholder: true });
    } else {
      // For other states, you could populate districts if you have data.
      // For now leave districts disabled or populate with a "Not available" option:
      $district.append('<option disabled>No district list available</option>');
      $district.prop('disabled', true);
    }
  });

  // Optional: for accessibility - open dropdown when clicked on label or container
  // (not necessary if native <select> behavior is fine)
});

$(function () {
  // map control id -> form id
  var mapping = {
    "control-1": "#form-1",
    "control-2": "#form-2",
    "control-3": "#form-3",
    "control-4": "#form-4"
  };

  // initialize: hide all forms except form-1
  $("#form-1, #form-2, #form-3, #form-4").hide();
  $("#form-1").show();

  // handle radio change
  $('input[name="registerAs"]').on('change', function () {
    var id = $(this).attr("id");
    var target = mapping[id];
    if (!target) return;

    // hide other forms and show selected
    $("#form-1, #form-2, #form-3, #form-4").not(target).hide();
    $(target).fadeIn(200);

    // remove .active from all labels, then add to the one containing this input
    $('.reg-form-control .form-check-label').removeClass('active');
    $(this).closest('.form-check-label').addClass('active');

    // focus first visible input (optional)
    $(target).find("input, select, textarea").filter(":visible").first().focus();
  });
});