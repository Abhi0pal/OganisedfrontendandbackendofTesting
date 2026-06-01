var multiItemSlider = (function () {
  return function (selector, config) {
    var
      _mainElement = document.querySelector(selector), // основный элемент блока
      _sliderWrapper = _mainElement.querySelector('.slider__wrapper'), // обертка для .slider-item
      _sliderItems = _mainElement.querySelectorAll('.slider__item'), // элементы (.slider-item)
      _sliderControls = _mainElement.querySelectorAll('.psslider__control'), // элементы управления
      _sliderControlLeft = _mainElement.querySelector('.psslider__control_left'), // кнопка "LEFT"
      _sliderControlRight = _mainElement.querySelector('.psslider__control_right'), // кнопка "RIGHT"
      _wrapperWidth = parseFloat(getComputedStyle(_sliderWrapper).width), // ширина обёртки
      _itemWidth = parseFloat(getComputedStyle(_sliderItems[0]).width), // ширина одного элемента    
      _positionLeftItem = 0, // позиция левого активного элемента
      _transform = 0, // значение транфсофрмации .slider_wrapper
      _step = _itemWidth / _wrapperWidth * 100, // величина шага (для трансформации)
      _items = []; // массив элементов
     

    // наполнение массива _items
    _sliderItems.forEach(function (item, index) {
      _items.push({ item: item, position: index, transform: 0 });
    });
    var total_items = _items.length;
    var slid_end_count = total_items-4;
    
    $(".psslider__control_left").addClass("hideslidbtn");

    var position = {
      getItemMin: function () {
        var indexItem = 0;
        _items.forEach(function (item, index) {
          if (item.position < _items[indexItem].position) {
            indexItem = index;
          }
        });
        return indexItem;
      },
      getItemMax: function () {
        var indexItem = 0;
        _items.forEach(function (item, index) {
          if (item.position > _items[indexItem].position) {
            indexItem = index;
          }
        });
        return indexItem;
      },
      getMin: function () {
        return _items[position.getItemMin()].position;
      },
      getMax: function () {
        return _items[position.getItemMax()].position;
      }
    }

    var _transformItem = function (direction) {
      var nextItem;
      if (direction === 'right') {
        _positionLeftItem++;
        console.log('rightclick  '+_positionLeftItem);
        if(_positionLeftItem==slid_end_count){
          $(".psslider__control_right").addClass("hideslidbtn");
          $(".psslider__control_left").removeClass("hideslidbtn");
        }else{
          if( _positionLeftItem>0 || _positionLeftItem > slid_end_count){
            $(".psslider__control_left").removeClass("hideslidbtn");
            $(".psslider__control_right").removeClass("hideslidbtn");
          }
        }
        //console.log( _positionLeftItem);
        /*if ((_positionLeftItem + _wrapperWidth / _itemWidth - 1) > position.getMax()) {
          nextItem = position.getItemMin();
           console.log(nextItem);
          _items[nextItem].position = position.getMax() + 1;
          _items[nextItem].transform += _items.length * 100;
          _items[nextItem].item.style.transform = 'translateX(' + _items[nextItem].transform + '%)';
        }*/
        _transform -= _step;
      }
      if (direction === 'left') {
        _positionLeftItem--;
        console.log('leftclick '+_positionLeftItem);
        if(_positionLeftItem==0){
          //console.log('_transformItem '+_items[nextItem].position); 
          $(".psslider__control_left").addClass("hideslidbtn");
          $(".psslider__control_right").removeClass("hideslidbtn");
        }else{
          if(_positionLeftItem>1 || _positionLeftItem < slid_end_count){
            $(".psslider__control_left").removeClass("hideslidbtn");
            $(".psslider__control_right").removeClass("hideslidbtn");
          }
        }
        
        //console.log( _positionLeftItem);
        if (_positionLeftItem < position.getMin()) {
          nextItem = position.getItemMax();
          console.log(nextItem);
          _items[nextItem].position = position.getMin() - 1;
          _items[nextItem].transform -= _items.length * 100;
          _items[nextItem].item.style.transform = 'translateX(' + _items[nextItem].transform + '%)';
        }
        _transform += _step;
      }
      _sliderWrapper.style.transform = 'translateX(' + _transform + '%)';

         
    }

    // обработчик события click для кнопок "назад" и "вперед"
    var _controlClick = function (e) {
      var direction = this.classList.contains('psslider__control_right') ? 'right' : 'left';
      e.preventDefault();
      _transformItem(direction);
    };

    var _setUpListeners = function () {
      // добавление к кнопкам "назад" и "вперед" обрботчика _controlClick для событя click
      _sliderControls.forEach(function (item) {
        item.addEventListener('click', _controlClick);
      });
    }

    // инициализация
    _setUpListeners();

    return {
      right: function () { // метод right
        _transformItem('right');
      },
      left: function () { // метод left
        _transformItem('left');
      }
    }

  }
}());

var slider = multiItemSlider('.speakers-slider')