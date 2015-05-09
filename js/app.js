(function(window, imageSelector) {
  function ImagePreloader() {
    var DELAY_TIME = 350,
        DELAY = 100,
        FADE_IN_TIME = 250;


    // Array of booleans keeps track of whether an image has loaded or not.
    var isLoaded = [];

    var icon;
    var timer;
    var images;


    // Find each image node, wrap set its styles and wrap it.
    function getImages(selector) {
      var selector = document.querySelector(selector);
      var imageNodes;
      var length;

      // Either a selector wasnt passed in, or the node doesnt exist.
      if (!selector) return;

      if (selector.tagName.toLowerCase() === 'img') {
          // Hide the image.
          setImageStyle(selector);
          wrap(selector);

          // Wrap the single image in an array.
          imageNodes = [selector];

          return imageNodes;
      }

      imageNodes = selector.getElementsByTagName('img'),
      length = imageNodes.length;

      // No images, return.
      if (length < 1) return;

      for (var i = 0; i < length; i++) {
        setImageStyle(imageNodes[i]);
        wrap(imageNodes[i]);
        isLoaded[i] = false;
      }

      return imageNodes;
    }


    function setImageStyle(img) {
      img.style.visibility = "hidden";
      img.className = img.className + " hide-image";
    }


    function wrap(node) {
      var wrapper = document.createElement('span');
      wrapper.className = 'preloader';

      var parent = node.parentNode;

      parent.insertBefore(wrapper, node);
      wrapper.appendChild(node);
    }

    // Preload the preload icon;
    function createPreloadIcon() {
      var icon = document.createElement('img');

      icon.src = "../images/preloader.gif";
      icon.style.display = "none";
      document.body.appendChild(icon);

      return icon;
    }


    function delayedFn(timeout, fn) {
      var args = [].slice.call(arguments, 2);

      setTimeout(function() {
        fn.apply(null,args)
      }, timeout);
    }


    function removePreloadClass(imageNode) {
      imageNode.parentNode.className = imageNode.parentNode.className.replace("preloader", "");
    }


    function startPreloader(images) {
      var timer;
      var images = Array.prototype.slice.call(images);

      var localDelay = DELAY_TIME;

      function isImagePreloaded() {
        var ii = 0;
        var length = images.length;

        // All images have been loaded.
        if (length === 0) {
          clearInterval(timer);
          return;
        }

        for (ii; ii < length; ii++) {

          if (typeof images[ii] !== 'undefined' && images[ii].complete === true) {

            if (!isLoaded[ii]) {
              isLoaded[ii] = !!isLoaded;
              isLoaded.splice(ii,1);
              localDelay += DELAY;
            }

            function showImage(image, delayTime) {
              image.style.visibility = "visible";

              delayedFn(delayTime, function() {
                image.className = image.className + " show-image";
                delayedFn(FADE_IN_TIME, removePreloadClass, image);
              });
            }

            showImage(images[ii], localDelay);

            images.splice(ii,1);
          }
        }
      }

      timer = setInterval(function() {
        isImagePreloaded();
      },300);
    }



    /**
      * Initialization
    **/

    imgs = getImages(imageSelector);
    icon = createPreloadIcon();

    function loaded() {
      if(icon.complete === true) {
        clearInterval(timer);
        document.body.removeChild(icon);
        startPreloader(imgs);
      }
    }

    timer = setInterval(function() {
      loaded();
    }, 50);
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
        if (!collection) return;

        if (idx > collection.length - 1) {
          return collection[0];
        }

        if (idx < 0) {
          return collection[collection.length - 1];
        }

        return collection[idx];
      }
    };
  }


  function SideBarView(elem) {
    this.el = elem;

    this.template = doT.template(document.getElementById('sidebar-template').text);

    this.bindEvent('#close-btn', 'click', this.toggle);
    this.bindEvent('#next-btn', 'click', this.next);
    this.bindEvent('#prev-btn', 'click', this.prev);


    this.closed = true;

    this.onClose = document.createEvent('Event');
    this.onClose.initEvent('ON_SIDEBAR_CLOSE', true, true);

    this.onNavigate = document.createEvent('Event');
    this.onNavigate.initEvent('ON_NAVIGATE', true, true);
  }

  SideBarView.prototype = {
    bindEvent: function(selector, evnt, fn) {
      fn = fn || function() {};

      var self = this;

      var elem = this.el.querySelector(selector);

      if (typeof elem === 'undefined') {
        return;
      }

      elem.addEventListener(evnt, function(evt) {
        fn.call(self, evt);
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
      document.addEventListener('keydown', this._onKeyPress.bind(this));
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

      this.el.className = this.el.className.replace(' hide-animation', '');
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
      document.dispatchEvent(this.onClose);
    },

    next: function() {
      if (!this.model) {
        return;
      }

      var nextIdx = this.model.id + 1;
      this.update(projectsService.get(nextIdx), nextIdx);
    },

    prev: function() {
      if (!this.model) {
        return;
      }

      var prevIdx = this.model.id - 1;
      this.update(projectsService.get(prevIdx), prevIdx);
    },

    update: function(project, index) {
      this.model = project;
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
  }

})(window, '#main-list');
