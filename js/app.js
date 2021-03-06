(function(window, imageSelector) {
  function ImagePreloader() {
    var DELAY_TIME = 350,
        DELAY = 100,
        FADE_IN_TIME = 200;


    var pendingImages = (function() {
      var list = [];

      return {
        isLoaded: function() {
          return list.every(function(el) {
            return el === true;
          });
        },
        set: function(index, value) {
          list[index] = value;
        },

        get: function(index) {
          return list[index];
        }
      }
    })();

    var icon;
    var timer;
    var images;

    function isImage(node) {
      return node.tagName.toLowerCase() === 'img';
    }

    // @returns {Array} Array of a single HTMLElement
    function prepareImage(imgNode, loadedIndex) {
      setImageStyle(imgNode);
      wrap(imgNode);
      pendingImages.set(loadedIndex, false);

      return [imgNode];
    }

    // Find each image node, set its styles and wrap it.
    function getImages(selector) {
      var node = document.querySelector(selector);
      var imageNodes;

      // Either a selector wasnt passed in, or the node doesnt exist.
      if (!node) return;

      // Preloader was initialized with a single iamge, not a node containing
      // inmages as children
      if (isImage(node)) {
        // Hide the image and set loading state
        return prepareImage(node, 0);
      }

      imageNodes = node.getElementsByTagName('img');

      return [].reduce.call(imageNodes, function(accum, node, index) {
        return accum.concat(prepareImage(node, index));
      }, []);
    }


    function setImageStyle(img) {
      img.style.visibility = 'hidden';
      img.className = img.className + ' hide-image';
    }


    function wrap(node) {
      var wrapper = document.createElement('span');
      wrapper.className = 'preloader';

      var parent = node.parentNode;

      parent.insertBefore(wrapper, node);
      wrapper.appendChild(node);
    }

    // Preload the preload icon;
    function createPreloadIcon(callback) {
      var icon = document.createElement('img');

      icon.onload = callback;
      icon.style.display = 'none';
      icon.src = '../images/preloader.gif';
      document.body.appendChild(icon);
    }

    function delayedFn(timeout, fn) {
      var args = [].slice.call(arguments, 2);

      setTimeout(function() {
        fn.apply(null, args)
      }, timeout);
    }

    function removeClass(node, className) {
      node.className = node.className.replace(className, '');
    }

    function removePreloadClass(imageNode) {
      removeClass(imageNode.parentNode, 'preloader');
      removeClass(imageNode, 'hide-image');
    }

    function showImage(image, delayTime) {
      image.style.visibility = 'visible';

      delayedFn(delayTime, function() {
        image.className = image.className + ' show-image';
        delayedFn(FADE_IN_TIME, removePreloadClass, image);
      });
    }


    function startPreloader(images) {
      var timer;
      var images = [].slice.call(images);

      var localDelay = DELAY_TIME;

      function isImagePreloaded() {
        // All images have been loaded.
        if (pendingImages.isLoaded()) {
          clearInterval(timer);
          return;
        }

        images.forEach(function(image, index) {
          if (typeof image !== 'undefined' && image.complete === true && !pendingImages.get(index)) {
            pendingImages.set(index, true);
            localDelay += DELAY;

            showImage(image, localDelay);
          }
        });
      }

      timer = setInterval(function() {
        isImagePreloaded();
      }, 60);
    }

    /**
      * Initialization
    **/
    icon = createPreloadIcon(function() {
      document.body.removeChild(this);
      startPreloader(getImages(imageSelector));
    });
  }

  function whichAnimationEvents(element) {
    var t;
    var animations = {
      'animation':{
        start: 'animationstart',
        end: 'animationend'
      },
      'OAnimation': {
        start: 'oAnimationStart',
        end: 'oAnimationEnd'
      },
      'MozAnimation': {
        start: 'animationstart',
        end: 'animationend',
      },
      'WebkitTransition': {
        start: 'webkitAnimationEnd',
        end: 'webkitAnimationEnd'
      }
    }

    for(t in animations){
      if(element.style[t] !== undefined ){
        return animations[t];
      }
    }

    return animations.animation;
 }

  /**
    * Service object loads and stores json file of project information.
  **/
  function ProjectsService() {
    var JSON_PATH = "projects.json";
    var collection = [];

    function loadJSON(filepath, callback) {
      var xhr = new XMLHttpRequest();

      xhr.overrideMimeType('application/json');
      xhr.open('GET', filepath, true);

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          collection = JSON.parse(xhr.responseText).projects;

          for (var i = 0; i < collection.length; i++) {
            // Add indicies to collection.
            collection[i].id = i;
          }

          callback(collection);
        }
      };

      xhr.send(null);
    }

    return {
      getAll: function(callback) {
        // Collection hasn't been cached, fetch it.
        if (collection.length == 0) {
          loadJSON.call(this, JSON_PATH, function(projects) {
            return callback && callback(projects);
          });
        }

        return collection;
      },

      get: function(idx) {
        var nextIndex;

        if (!collection) return;

        if (idx > collection.length - 1) {
          nextIndex = 0;
          return [collection[nextIndex], nextIndex];
        } else if (idx < 0) {
          nextIndex = collection.length - 1;
          return [collection[nextIndex], nextIndex];
        }

        return [collection[idx], idx];
      }
    };
  }


  function SideBarView(elem) {
    this.el = elem;

    this.template = doT.template(document.getElementById('sidebar-template').text);

    this.bindEvent('#close-btn', 'click', this.toggle);
    this.bindEvent('#next-btn', 'click', this.next);
    this.bindEvent('#prev-btn', 'click', this.prev);
    this.bindAnimationEvents();

    this.closed = true;

    this.onClose = document.createEvent('Event');
    this.onClose.initEvent('ON_SIDEBAR_CLOSE', true, true);

    this.onNavigate = document.createEvent('Event');
    this.onNavigate.initEvent('ON_NAVIGATE', true, true);

    this._onKeyPress = this._onKeyPress.bind(this);
  }

  SideBarView.prototype = {
    bindEvent: function(selector, evnt, fn) {
      fn = fn || function() {};

      var self = this;

      var elem = selector instanceof HTMLElement ? selector :
        this.el.querySelector(selector);

      if (typeof elem === 'undefined') {
        return;
      }

      elem.addEventListener(evnt, function(evt) {
        fn.call(self, evt);
      });
    },

    bindAnimationEvents: function() {
      var animations = whichAnimationEvents(this.el);

      this.bindEvent(this.el, animations.start, function(event) {
        if (event.animationName === 'animateShow') {
          event.target.className = event.target.className + ' click-overlay';
        }
      });

      this.bindEvent(this.el, animations.end, function(event) {
        if (event.animationName === 'animateHide') {
          event.target.className = event.target.className.replace(/ click-overlay/, '');
        }
      });
    },

    render: function() {
      this.el.querySelector('#project-metadata').innerHTML = this.template(this.model);
    },

    _onKeyPress: function(event) {
      switch (event.keyCode) {
        case 27:
          this.close();
          break;
        case 39:
          this.next();
          break;
        case 37:
          this.prev();
          break;
      }
    },

    bindShortcuts: function() {
      document.addEventListener('keydown', this._onKeyPress);
    },

    unbindShortcuts: function() {
      document.removeEventListener('keydown', this._onKeyPress)
    },

    toggle: function() {
      this.closed ? this.open() : this.close();
    },

    open: function() {
      if (!this.closed) {
        return;
      }

      this.el.className = this.el.className.replace(/\s(hide-animation|hide)/  , '');
      this.el.className = this.el.className += ' show-animation';

      this.closed = false;
      this.bindShortcuts();
    },

    close: function() {
      if (this.closed) {
        return;
      }
      this.el.className = this.el.className.replace(' show-animation', '');
      this.el.className = this.el.className += ' hide-animation';

      this.closed = true;
      this.unbindShortcuts();
      this.model = null;
      document.dispatchEvent(this.onClose);
    },

    next: function() {
      if (!this.model) {
        return;
      }

      var nextIdx = this.model.id + 1;
      this.update(projectsService.get(nextIdx));
    },

    prev: function() {
      if (!this.model) {
        return;
      }

      var prevIdx = this.model.id - 1;
      this.update(projectsService.get(prevIdx));
    },

    update: function(project) {
      this.model = project[0];
      var index = project[1];

      this.render();

      this.onNavigate.data = index;
      document.dispatchEvent(this.onNavigate);
    }
  };


  // Initialization stufffff
  var projectsService = new ProjectsService();

  projectsService.getAll(function(collection) {
    var sidebar = new SideBarView(document.getElementById('project-detail-view'));
    var projectsTmpl = doT.template(document.getElementById('projects-template').text);
    var mediaBox;

    document.getElementById('main-list-wrapper').innerHTML = projectsTmpl({data: collection});
    mediaBox = [].slice.call(document.querySelectorAll('.media-box'));

    document.addEventListener('ON_SIDEBAR_CLOSE', function (e) {
      mediaBox.forEach(function(box) {
        box.className = box.className.replace(' active', '');
      });
     }, false);

     document.addEventListener('ON_NAVIGATE', onSidebarUpdate);

    new ImagePreloader();

    // Normally this would go in another view and have a controller to
    // coordinate events, but I'm making a portfolio, not writing a framework.
    function getProjectById(evt) {
      var index = +this.getAttribute('data-index');

      sidebar.update(projectsService.get(index), index);
      sidebar.open();
    }

    function onSidebarUpdate(event) {
      var currentIndex = event.data;

      mediaBox.forEach(function(box, i) {
        if (/ active/.test(box.className)) {
          box.className = box.className.replace(' active', '');
        }

        if (i === currentIndex) {
          box.className = box.className + ' active';
        }
      });
    }

    mediaBox.forEach(function(box) {
      box.onclick = getProjectById;
    });
  });



  /**
    * Resizing stuff
  **/
  var trackDocumentHeight = function(node) {
    node.style.height = document.documentElement.clientHeight + "px";
  }

  var equalHeight = function(nodeList) {
    var height = null;
    var length = nodeList.length;
    var i = length - 1;

    // find the tallest node
    for (i; i > 0; i--) {
      nodeList[i].style.height = "auto";
      if (nodeList[i].offsetHeight > height) {

        height = nodeList[i].offsetHeight;
      }
    }

    while (length-- > 0) {
      nodeList[length].style.height = height + "px";
    }
  }

  var nodes = document.querySelectorAll('.media-box');
  var adjustableNode = document.getElementById('project-detail-view');

  trackDocumentHeight(adjustableNode);
  equalHeight(nodes);

  var eventHandlers = {
    addHandler: function(type, handler) {
      this.handlers[type] = this.handlers[type] || [];

      var args = [].slice.call(arguments, 2);

      var wrapped = (function(args, fn) {
        return function() {
          fn.apply(null, args);
        }
      }(args, handler));

      this.handlers[type].push(wrapped);
    },
    handlers: {}
  };

  eventHandlers.addHandler('resize', equalHeight, nodes)
  eventHandlers.addHandler('resize', trackDocumentHeight, adjustableNode);


  window.onresize = function(evt) {
    var handlers = eventHandlers.handlers[evt.type];

    for (var i = 0; i < handlers.length; i++) {
      handlers[i]();
    }
  };

})(window, '#main-list');
