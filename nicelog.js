/* 
 * Copyright Nick Caballero 2012
 * License http://www.opensource.org/licenses/mit-license.php
 */

(function($) {
    
    //Tag
    var nicelog = 'nicelog',
    
    //Basic levels
    levels = [
    'error',
    'debug',
    'info',
    'warning',
    'system'
    ],
    
    //Defaults
    defaults = {
        levels:levels,
        counterBackground:'black',
        counterBackgroundFlash:'white',
        counterColor:'white',
        counterColorFlash:'black',
        timestamp:function() {
            return (new Date()).toString();
        }
    },
    
    //Inner utilities
    innerUtils = {
        /**
         * JSON syntax highlighter function from http://stackoverflow.com/a/7220510/724068
         */
        syntaxHighlight:function(json) {
            if(!(json instanceof String)) {
                try{
                    json = JSON.stringify(json, null, 2);
                }catch(e) {
                    return json;
                }
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                var cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        },
        /**
         * Get object data helper
         */
        getNicelogData:function(el) {
            return $(el).data('nicelog');
        },
        /**
         * Get nicelog wrapper of element helper
         */
        getParentContainer:function(child) {
            return $(child).closest('.'+nicelog+'-wrapper');
        },
        /**
         * Get nicelog entry container
         */
        getParentEntry:function(child) {
            return $(child).closest('li.'+nicelog+'-entry');
        },
        /**
         * Get container options helper
         */
        getContainerOptions:function($container) {
            var data = innerUtils.getNicelogData($container);
            if(data && data.options) {
                return data.options;
            }
            return null;
        },
        /**
         * Get container filters element helper
         */
        getContainerFilters:function($container) {
            return $('div.'+nicelog+'-filters', $container);
        },
        /**
         * Get container log element helper
         */
        getContainerLog:function($container) {
            return $('ul.'+nicelog+'-log', $container);
        },
        /**
         * Clear log click handler
         */
        clearLog:function() {
            var $container = innerUtils.getParentContainer(this);
            var $targets = innerUtils.getContainerLog($container).find('li').not('li.'+nicelog+'-flag');
            if($targets.length > 0 && confirm('Are you sure?')) {
                $targets.remove();
                $('button', innerUtils.getContainerFilters($container)).each(function(index, button) {
                    var level = $('span.'+nicelog+'-title', button).text();
                    if(level != 'flag') {
                        $(button).find('span.'+nicelog+'-counter').text(innerUtils.getContainerLog($container).find('li.'+nicelog+'-level-'+level).length);
                    }
                });
            }
        },
        /**
         * Collapse log extras click handler
         */
        collapseLog:function() {
            var $log = innerUtils.getContainerLog(innerUtils.getParentContainer(this));
            $('li div.'+nicelog+'-extra', $log).hide('fast');
        },
        /**
         * Expand log extras click handler
         */
        expandLog:function() {
            var $log = innerUtils.getContainerLog(innerUtils.getParentContainer(this));
            $('li', $log).not('.filtered').find('div.'+nicelog+'-extra').show('fast');
        },
        /**
         * Collapse log click handler
         */
        maskLog:function() {
            var $container = innerUtils.getParentContainer(this);
            var $log = innerUtils.getContainerLog($container);
            $log.toggleClass(nicelog+'-mask');
            $(this).toggleClass(nicelog+'-active', 'slow');
            var options = innerUtils.getContainerOptions($container);
            if(options.onMask && typeof options.onMask == 'function') {
                options.onMask.call($log.find('li.'+nicelog+'-flag'), $log.hasClass(nicelog+'-mask'));
            }
        },
        /**
         * Add a log entry
         */
        addLogEntry:function($container, tag, extra, level, timestamp) {
            
            var levels = innerUtils.getContainerOptions($container).levels;
            if(levels.indexOf(level) === -1) {
                return;
            }
            
            timestamp = timestamp || innerUtils.getContainerOptions($container).timestamp(tag, extra, level);
            
            var $tag = $('<span>').addClass(nicelog+'-tag').text(tag);
            var $timestamp = $('<span>').addClass(nicelog+'-timestamp').text(timestamp);
            var $flag = $('<button>').addClass(nicelog+'-flag');
            
            var $entry = $('<li>').addClass(nicelog+'-level-'+level, nicelog+'-entry').append($timestamp, $flag, $tag);
            
            //Add extras if any and add click toggle handler
            if(extra && typeof extra == 'object') {
                var $extras = $('<div>').addClass(nicelog+'-extra').appendTo($entry);
                for(var extraName in extra) {
                    $extras.append($('<span>').text(extraName));
                    $extras.append($('<pre>').html(innerUtils.syntaxHighlight(extra[extraName])));
                }
                $tag.addClass(nicelog+'-hefty').click(function() {
                    $extras.toggle('fast');
                });
            }
            
            //Increase counter for level
            var $counter = $('button.'+nicelog+'-level-'+level+' span.'+nicelog+'-counter', innerUtils.getContainerFilters($container));
            $counter.text(parseInt($counter.text())+1).stop(true,true).css({
                'background-color':innerUtils.getContainerOptions($container).counterBackgroundFlash, 
                'color':innerUtils.getContainerOptions($container).counterColorFlash
            }).animate({
                'background-color':innerUtils.getContainerOptions($container).counterBackground, 
                'color':innerUtils.getContainerOptions($container).counterColor
            }, 3000);
            
            //Add entry to the log
            $entry.prependTo(innerUtils.getContainerLog($container));
            if($('button.'+level, innerUtils.getContainerFilters($container)).hasClass('inactive')) {
                $entry.addClass('filtered');
            } else {
                $entry.fadeIn('fast');
            }
            
            //Add flag click handler
            $flag.click(function() {
                var $log = innerUtils.getContainerLog($container);
                var $filters = innerUtils.getContainerFilters($container);
                $entry.toggleClass(nicelog+'-flag');
                var count = $('li.'+nicelog+'-flag', $log).length;
                $('button.'+nicelog+'-level-flag span.'+nicelog+'-counter', $filters).text(count);
                
                //Call callback
                var options = innerUtils.getContainerOptions($container);
                if($entry.hasClass(nicelog+'-flag')) {
                    if(options.onFlag && typeof options.onFlag == 'function') {
                        options.onFlag.call($entry, tag, extra, level, timestamp);
                    }
                } else {
                    if(options.onDeflag && typeof options.onDeflag == 'function') {
                        options.onDeflag.call($entry, tag, extra, level, timestamp);
                    }
                }
            })
            
            //Set entry properties
            $entry.data('nicelog', {
                tag:tag, 
                extra:extra, 
                level:level, 
                timestamp:timestamp
            });
        }
    },
    initLog = function($container, options) {
        
        //Defaults
        options = $.extend({}, defaults, options);
        $container.data('nicelog', {
            options:options
        });
        
        //Init log
        var $log = $('<ul>').addClass('nicelog-log');
        
        //Toolbar
        var $filters = $('<div>').addClass('nicelog-filters');
        var $controls = $('<div>').addClass('nicelog-controls');
        var $tools = $('<div>').addClass('nicelog-tools').append($filters, $('<hr>'), $controls);
        
        //Basic tools
        $controls.append($('<button>').text('Clear').click(innerUtils.clearLog).addClass(nicelog+'-clear'));
        $controls.append($('<button>').text('Collapse').click(innerUtils.collapseLog).addClass(nicelog+'-collapse'));
        $controls.append($('<button>').text('Expand').click(innerUtils.expandLog).addClass(nicelog+'-expand'));
        $controls.append($('<button>').text('Mask').click(innerUtils.maskLog).addClass(nicelog+'-mask')).addClass(nicelog+'-active', 0).removeClass(nicelog+'-active');
        
        //Wrap the nicelog
        $container.append($('<div>').addClass(nicelog+'-wrapper').append($tools).append($log));
        
        //Create filter buttons
        var entryFilters = $.makeArray(options.levels);
        entryFilters.push('flag');
        $.each(entryFilters, function(index, filter) {
            $('<button>').addClass(nicelog+'-level-'+filter).
            append($('<span>').addClass(nicelog+'-title').text(filter)).
            append($('<span>').addClass(nicelog+'-counter').text('0')).
            click(function() {
            
                //Make exception for flag class
                var targetClass = nicelog+(filter!='flag'?'-level-':'-')+filter;
                
                if($(this).hasClass(nicelog+'-inactive')) {
                    $(this).removeClass(nicelog+'-inactive', 'fast');
                    $('li.'+targetClass, $log).removeClass(nicelog+'-filtered');
                } else {
                    $(this).addClass(nicelog+'-inactive', 'fast');
                    $('li.'+targetClass, $log).addClass(nicelog+'-filtered');
                    
                    //Enable entries that are enabled by another filter. This applies mostly just to flag
                    $('button', $filters).each(function(index, button) {
                        var activeFilter = $('span.'+nicelog+'-title', button).text();
                        if(!$(button).hasClass(nicelog+'-inactive') && filter != activeFilter) {
                            //Make exception for flag class
                            var targetClass = nicelog+(activeFilter!='flag'?'-level-':'-')+activeFilter;
                            $('li.'+targetClass, $log).removeClass(nicelog+'-filtered');
                        }
                    });
                }
            }).
            appendTo($filters);
        })
        
        //Keep tools in container
        //Approach inspired by http://www.wduffy.co.uk/jScroll/
        var oriTopMargin = parseInt($tools.css('margin-top'), 10) || 0,
        oriBottomMargin = parseInt($tools.css('margin-bottom'), 10) || 0,
        $wrapper = $('<div>').addClass(nicelog+'-tools-wrapper').height($tools.outerHeight()+oriTopMargin+oriBottomMargin);
        $tools.after($wrapper).appendTo($wrapper);
        
        //This should not be necessary since wrapper has text-align center, but it only centers tools when window is resized, in Chrome
        var toolsCenter = function() {
            $tools.css({
                'left':($wrapper.outerWidth(true)/2)-($tools.outerWidth(true)/2)
            })
        };
        $(window).resize(toolsCenter);
        toolsCenter();
        
        $(window).scroll(function() {
            var max = $log.height()-oriBottomMargin;
            var margin = oriTopMargin;
            var toolsTopOffset = $tools.offset().top-(parseInt($tools.css('margin-top'), 10) || 10);
            if(toolsTopOffset < $(window).scrollTop()) {
                margin = oriTopMargin+$(window).scrollTop()-toolsTopOffset;
            }
            if(margin > max) {
                margin = max;
            }
            $tools.stop(true, true).animate({
                'margin-top':margin
            }, 'slow');
        });
        
        //Extend public method with levels
        $.each(options.levels, function(index, level) {
            if(!publicMethod[level]) {
                publicMethod[level] = function(tag, extra, $altContainer) {
                    innerUtils.addLogEntry($altContainer || $container, tag, extra, level);
                }
            }
        })
        
    //Load local history if any
    },
    publicMethod = $.fn[nicelog] = $[nicelog] = function(options) {
        
        var $this = this;
        options = options || {};
        
        if($this.length && $this.length == 1) {
            return initLog($this, options);
        }
        
        return $this;
    };
})(jQuery);