/**
 * Contao Open Source CMS
 * Copyright (C) 2005-2011 Leo Feyer
 *
 * Formerly known as TYPOlight Open Source CMS.
 *
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this program. If not, please visit the Free
 * Software Foundation website at <http://www.gnu.org/licenses/>.
 *
 * PHP version 5
 * @copyright  Leo Feyer 2005-2011
 * @author     Leo Feyer <http://www.contao.org>
 * @package    Frontend
 * @license    LGPL
 * @filesource
 */



/**
 * Class MobileNavigation
 *
 * Provide methods to load/display WC's Mobile Navigation
 *
 * @copyright  Winans Creative 2012
 * @author     Blair Winans <blair@winanscreative.com>
 * @author     Adam Fisher <adam@winanscreative.com>
 */
var MobileNavigation = new Class(
{
	Implements: Options,
	
	intHeight:			0,
	intWidth:			0,
	blnMenuOpen:		false,
	blnNeedResize:		true,
	blnLandscape:		false,
	objMobileStage:		false,
	
	options:
	{
	
		// These allow you to pass an element rather than an ID
		elMobileNavigation:				false,
		elMobileNavigationTop:				false,
		elMobileNavigationInside:			false,
		elPanelContainer:					false,
		elHiddenPanelContainer:				false,
		
		// The IDs used as a fallback if the element isn't set
		idMobileNavigation:					'mobilenavigation',
		idMobileNavigationTop:				'mobilenavigationtop',
		idMobileNavigationInside:			'mobilenavigationinside',
		idPanelContainer:					'panelcontainer',
		idHiddenPanelContainer:				'hiddenpanelcontainer',
		
		// Other misc settings
		panelSelector:						'.panel',						// Selector of the panels to slide left/right
		panelHeaderSelector:				'.panelHeader',					// Selector of the panel header wrapper
		panelContentSelector:				'.panelContent',				// Selector of the panel content wrapper
		submenuButtonSelector:				'.submenuButton',				// Selector of the submenu buttons
		backButtonSelector:					'.menuBack',					// Selector of the back buttons
		navItemsSelector:					'.navItems',					// Selector for the nav items container
		portraitClass:						'portrait',						// Portrait  mode <body> class
		landscapeClass:						'landscape',					// Landscape mode <body> class
		dropTransition:						'sine:in',						// Transition type for the slide up/down
		dropDuration:						'short',						// Duration of the slide up/down
		slideTransition:					Fx.Transitions.Sine.easeOut,	// Transition type for the slide left/right
		slideDuration:						400,							// Duration of the slide left/right
		zIndex:								9999,							// Z-index of the mobile menu
		preventClickSelectors:				'ul, li, a',					// Prevent the click (menu open/close) on inner elements
		preventTouchMove:					false,							// Prevent the screen from scrolling by touch
		portraitMaxHeight:					285,							// Max height of the menu in portrait mode
		landscapeMaxHeight:					135,							// Max height of the menu in landscape mode
	},
	
	initialize: function(options)
	{
		this.setOptions(options);
		
		if (this.setElements())
		{
			this.setOrientation();
			this.setInitialPanel();
			this.setClosedPosition();
			this.setEvents();
			this.setListeners();
			
			window.fireEvent('orientationchange');
		}
		
		// Fire event to use as a hook if need be
		window.fireEvent('mobileNavigationMenuLoaded', this);
	},
	
	/**
	 * Load elements from either the elements passed to the options or the IDs
	 * @return	boolean
	 */
	setElements: function()
	{
		// Check for the mobile navigation element first
		if (this.options.elMobileNavigation === false && $(this.options.idMobileNavigation))
		{
			this.options.elMobileNavigation = $(this.options.idMobileNavigation);
			
			// Move the mobile navigation element to just outside the body tag for absolute positioning
			this.options.elMobileNavigation = this.options.elMobileNavigation.inject(document.getElement('body'), 'top');
		}
		else
		{
			return false;
		}
		
		// Get the mobile navigation's top element (for a top image)
		if (this.options.elMobileNavigationTop === false && $(this.options.idMobileNavigationTop))
		{
			this.options.elMobileNavigationTop = $(this.options.idMobileNavigationTop);
		}
		
		// Get the inside div element
		if (this.options.elMobileNavigationInside === false && $(this.options.idMobileNavigationInside))
		{
			this.options.elMobileNavigationInside = $(this.options.idMobileNavigationInside);
		}
		
		// Get the panel container element
		if (this.options.elPanelContainer === false && $(this.options.idPanelContainer))
		{
			this.options.elPanelContainer = $(this.options.idPanelContainer);
		}
		
		// Get the hidden panel container element
		if (this.options.elHiddenPanelContainer === false && $(this.options.idHiddenPanelContainer))
		{
			this.options.elHiddenPanelContainer = $(this.options.idHiddenPanelContainer);
		}
		
		return true;
	},
	
	setInitialPanel: function()
	{
		if (this.options.elHiddenPanelContainer !== false)
		{
			var panels = this.options.elHiddenPanelContainer.getElements(this.options.panelSelector);
			if (panels.length > 0)
			{
				// Move the first panel into the panel container
				panels[0].inject(this.options.elPanelContainer, 'top');
				this.objMobileStage = new MobileStage(this.options.elPanelContainer, this.options);
				this.setInsideHeight();
			}
		}
	},
	
	setClosedPosition: function()
	{
		this.objWindowSize 		= window.getSize();
		this.objTopSize 		= this.options.elMobileNavigationTop.getSize();
		this.objInsideSize 		= this.options.elMobileNavigationInside.getSize();
		this.intPadBottom 		= parseInt(this.options.elMobileNavigationInside.getStyle('padding-bottom'));
		this.intPadTop 			= parseInt(this.options.elMobileNavigationInside.getStyle('padding-top'));
		
		this.intNewLeft			= (parseInt(this.objInsideSize.x) / 2) - ((parseInt(this.objInsideSize.x)) / 2);
		this.intNewTop			= -(this.intHeight + this.intPadTop + this.objTopSize.y);
					
		this.options.elMobileNavigation.setStyles({
			left:		this.intNewLeft,
			top:		this.intNewTop,
	        "z-index":	parseInt(this.options.zIndex)
		});
	},
	
	setOpenPosition: function()
	{
		this.options.elMobileNavigation.setStyle('top', '0px');
	},
	
	setOrientation: function()
	{
		this.blnLandscape = (window.orientation==0 || window.orientation==180) ? false : true;
		
		var currclass = this.blnLandscape ? this.options.landscapeClass : this.options.portraitClass;
		var oldclass = this.blnLandscape ? this.options.portraitClass : this.options.landscapeClass;
		
		if (document.body.hasClass(oldclass))
		{
			document.body.removeClass(oldclass);
		}
		
		document.body.addClass(currclass);
			
	},
	
	setEvents: function()
	{
		// Don't move the screen when you pull the menu down
		this.options.elMobileNavigation.addEvent('touchmove', function(event)
		{
			event.preventDefault();
		});
		
		// Don't move the screen when you pull the menu down
		if (this.options.elMobileNavigationInside)
		{
			this.options.elMobileNavigationInside.addEvent('touchmove', function(event)
			{
				event.stopPropagation();
			});
		}
		
		// Lock the screen on mobile devices if the option is set
		if (this.options.preventTouchMove)
		{
			document.addEvent('touchmove', function(event)
			{
			    event.preventDefault();
			});
		}
		
		// Add click events to the mobile navigation
		this.options.elMobileNavigation.addEvent('mouseup', function(){
		
			// Reset the mobile navigation height so we have an accurate position
			this.setInsideHeight();
			
			if (this.options.elMobileNavigation.getPosition().y != 0)
			{
				// Slide down
				(function(){
					var fx = new Fx.Tween(this.options.elMobileNavigation.get('id'), {
					    duration:		this.options.dropDuration,
					    transition:		this.options.dropTransition,
					    link:			'cancel',
					    property:		'top',
					    onComplete:		(function(){ this.blnMenuOpen = true; }).bind(this)
					});
					
					fx.start(-(this.intHeight + this.objTopSize.y), 0);
					
				}).delay(50, this);
			}
			else
			{
				// Slide up
				(function(){
					var fx = new Fx.Tween(this.options.elMobileNavigation.get('id'), {
					    duration:		this.options.dropDuration,
					    transition:		this.options.dropTransition,
					    link:			'cancel',
					    property:		'top',
					    onComplete:		(function(){ this.blnMenuOpen = false; }).bind(this)
					});
					
					fx.start(0, -(this.intHeight + this.objTopSize.y));
					
				}).delay(50, this);
			}
		}.bind(this));
		
		// Prevent the click (menu open/close) on inner elements
		var els = this.options.elMobileNavigation.getElements(this.options.preventClickSelectors);
		if (els.length > 0)
		{
			els.each(function (item, index) {
				item.addEvent('mouseup', function(event){
					event.stopPropagation();
				});
			});
		}
		
		// Set the initial submenu events
		this.setSubmenuButtonEvents(this.options.elMobileNavigation);
		
		// Set the back button events
		this.setBackButtonEvents(this.options.elHiddenPanelContainer);
		
	},
	
	setListeners: function()
	{
		// Listen for orientation changes
		window.addEventListener("orientationchange", function()
		{
			this.doResize();
			
		}.bind(this), false);
		
		// Some devices do not support orientationchange event
		window.addEventListener("resize", function() 
		{
			if (this.blnNeedResize)
			{
				this.doResize();
			}
		}.bind(this), false);
	},
	
	/**
	 * Called on a window resize or orientation change
	 */
	doResize: function()
	{
		this.setOrientation();
		
		// Reset the mobile navigation height so we have an accurate position
		this.setInsideHeight();
		
		// Reset the mobile navigation position depending on whether it's open or not
		if (this.blnMenuOpen)
			this.setOpenPosition();
		else
			this.setClosedPosition();
		
		// Reset the mobile stage
		if (this.objMobileStage)
		{
			this.objMobileStage.setOrientation();
			this.objMobileStage.resizeStage();
			this.objMobileStage.resetLeftPosition();
		}
		
		this.blnNeedResize = false;
	},
	
	setInsideHeight: function()
	{
		try
		{
			var panelContents = this.options.elPanelContainer.getElements(this.options.panelContentSelector);
			if (panelContents.length > 0)
			{
				// Get the height of the tallest panel in the set (but don't exceed max height)
				var intHeight = this.intHeight;
				var intMaxHeight = this.blnLandscape ? this.options.landscapeMaxHeight : this.options.portraitMaxHeight;
				
				for (var i = 0; i < panelContents.length; i++)
				{
					if (panelContents[i].getSize().y > intHeight)
					{
						intHeight = panelContents[i].getSize().y;
					}
				}
				
				this.intHeight = (intHeight > intMaxHeight) ? intMaxHeight : intHeight;
				this.options.elMobileNavigationInside.setStyle('height', this.intHeight);
				this.options.elPanelContainer.setStyle('height', this.intHeight);
			}
		}
		catch (err) {}
	},
	
	setSubmenuButtonEvents: function(elContainer)
	{
		var submenuButtons = elContainer.getElements(this.options.submenuButtonSelector);
		if (submenuButtons.length > 0)
		{
			submenuButtons.each(function(item)
			{
				item.addEvent('click', function(item)
				{
					// Get the unique ID and the next submenu panel
					var strClasses = item.getProperty('class');
					var arrClasses = strClasses.split(' ');
					var elSubmenuPanel = this.getSubmenuPanel(arrClasses[arrClasses.length - 1]);
					
					// Add the next submenu panel and slide to it
					this.objMobileStage.addPanel(elSubmenuPanel);
					this.objMobileStage.slidePanel({direction: 'left'});
					
					return false;
					
				}.bind(this, item));
			}.bind(this));
		}
	},
	
	setBackButtonEvents: function(elContainer)
	{
		var backButtons = elContainer.getElements(this.options.backButtonSelector);
		if (backButtons.length > 0)
		{
			backButtons.each(function(item)
			{
				item.addEvent('click', function(item)
				{
					// Slide the menu back
					this.objMobileStage.slidePanel({direction: 'right'});
					
					(function(){
					
						// Get the back button's parent panel
						var elParentPanel = item.getParents(this.options.panelSelector)[0];
						
						// Put the panel back into the hidden panel container
						this.objMobileStage.removePanel(elParentPanel, this.options.elHiddenPanelContainer);
						
					}).delay(this.options.slideDuration, this, item);
					
					return false;
					
				}.bind(this, item));
			}.bind(this));
		}
	},
	
	getSubmenuPanel: function(uniqueId)
	{
		var children = this.options.elHiddenPanelContainer.getChildren('.' + uniqueId);
		
		if (children.length)
		{
			return children[0];
		}
	}

});


/**
 * Class MobileStage
 *
 * Provide methods to load/display a swipable panel
 * @copyright  Winans Creative 2011
 * @author     Blair Winans <http://www.winanscreative.com>
 * @package    Frontend
 */
var MobileStage = new Class(
{
	Implements: Options,
	Binds: ['toggleSlidingOn', 'toggleSlidingOff'],
	
	currentIndex:	0,
	totalWidth: 	0,
	isSliding: 		0,
	blnLandscape:	false,
	
	options:
	{
	
		panelSelector:				'.panel',		// Selector of the inner panels to slide left/right
		slideTransition:			'sine:in',		// Transition type for the slide left/right
		slideDuration:				'short'			// Duration of the slide left/right
	},
	
	initialize: function(element, options)
	{
		this.setOptions(options);
		this.setOrientation();
		
		this.element = element;
		this.mobileNavInside = this.options.elMobileNavigationInside;
		this.currDim = this.element.getSize();
		
		// Set width
		this.panelWidth = this.currDim.x;
		
		// Set height
		if (this.blnLandscape)
			this.panelHeight = this.options.landscapeMaxHeight > this.mobileNavInside.getStyle('height').toInt() ? this.mobileNavInside.getStyle('height').toInt() : this.options.landscapeMaxHeight;
		else
			this.panelHeight = this.options.portraitMaxHeight > this.mobileNavInside.getStyle('height').toInt() ? this.mobileNavInside.getStyle('height').toInt() : this.options.portraitMaxHeight;
			
		var insidePadding = parseInt(this.mobileNavInside.getStyle('padding-top') + this.mobileNavInside.getStyle('padding-bottom'));
		this.panelHeight -= insidePadding;
		
		//Set up all the panels
		this.panels = this.element.getElements(this.options.panelSelector);
		this.totalWidth = this.panelWidth * this.panels.length + (10 * this.panels.length);
		this.element.setStyles({position: 'absolute', width: this.totalWidth, height: this.panelHeight, left:0});
		
		this.panels.each( function(panel,idx){
		
			//Account for padding
			var panelPadding = parseInt(panel.getStyle('padding-right')) + parseInt(panel.getStyle('padding-left'));
			var insidePadding = parseInt(this.mobileNavInside.getStyle('padding-top') + this.mobileNavInside.getStyle('padding-bottom'));
			
			panel.setStyles({
				width: this.panelWidth - panelPadding,
				height: this.panelHeight,
				float: 'left'
			});
		}.bind(this));
		
		//Set up the Morph
		this.element.set('morph', {
			link:			'ignore',
			duration: 		this.options.slideDuration, 
			transition: 	this.options.slideTransition,
			onStart: 		this.toggleSlidingOn,
			onComplete: 	this.toggleSlidingOff,
		});
	
	},
	
	setOrientation: function()
	{
		this.blnLandscape = (window.orientation==0 || window.orientation==180) ? false : true;
	},
    
    slidePanel: function(event, fn)
    {
    	if (this.isSliding == 0)
		{
			if (!$defined(fn))
				fn = Function.from('return;');
			
			//Get Current Position
			var currPos = parseInt(this.element.getStyle('left'));
			switch(event.direction)
			{
				case 'left':
					if (this.currentIndex == (this.panels.length - 1))
					{
						this.slideToEnd('left');
					}
					else
					{
						var endPos = currPos - this.panelWidth;
				    	var slideMorph = new Fx.Morph(this.element,{
				    		duration: 		this.options.slideDuration,
				    		transition: 	this.slideTransition,
				    		onStart: 		this.toggleSlidingOn,
							onComplete: 	(function(){ this.toggleSlidingOff(); fn.bind(this); }).bind(this)
				    	});
				    	
				    	slideMorph.start({left:[currPos,endPos]});
						this.currentIndex++;
					}
					break;
					
				default:
					if (this.currentIndex == 0)
					{
						this.slideToEnd('right');
					}
					else
					{
						var endPos = currPos + this.panelWidth;
				    	var slideMorph = new Fx.Morph(this.element,{
				    		duration: 		this.options.slideDuration,
				    		transition: 	this.slideTransition,
				    		onStart: 		this.toggleSlidingOn,
							onComplete: 	(function(){ this.toggleSlidingOff(); fn.bind(this); }).bind(this)
				    	});
				    	
				    	slideMorph.start({left:[currPos,endPos]});
						this.currentIndex--;
					}
			}
		}
    },
    
    slideToEnd: function(direction)
    {	
    	//Get Current Position
		var currPos = parseInt(this.element.getStyle('left'));
		var endPos = direction=='left' ? currPos-100 : currPos+100;
    	
    	var endMorph = new Fx.Morph(this.element,{
    		link:'chain',
    		duration: 'short',
    		transition: this.options.slideTransition,
    		onStart: this.toggleSlidingOn,
			onChainComplete:this.toggleSlidingOff
    	});
    	
    	endMorph.start({left:[currPos,endPos]}).start({left:[endPos,currPos]});
    },
	
	toggleSlidingOn: function()
	{
		this.isSliding = 1;  //prevents extra clicks
	},
	
	toggleSlidingOff: function()
	{
		this.isSliding = 0;  //prevents extra clicks
	},
	
	addPanel: function(elPanel)
	{
		if (this.isSliding == 1)
		{
			this.addPanel(elPanel); // keep trying to add the panel until sliding has finished 
		}
		
		// add the panelSelector class if need be
		if (!elPanel.hasClass(this.options.panelSelector.replace('.', '')))
		{
			elPanel.addClass(this.options.panelSelector.replace('.', ''));
		}
		
		elPanel.inject(this.panels[this.panels.length - 1], 'after');
		
		this.resizeStage();
	},
	
	removePanel: function(elPanel, elContainer)
	{
		if (elContainer)
		{
			// Instead of removing completely, move it into the supplied container
			elPanel.inject(elContainer);
		}
		else
		{
			// Remove completely
			elPanel.dispose();
		}
		
		this.resizeStage();
	},
	
	resizeStage: function()
	{
		// Set up all the panels
		this.panels = this.element.getElements(this.options.panelSelector);
		
		// Get width
		this.panelWidth = this.mobileNavInside.getStyle('width').toInt();
		
		// Get height
		if (this.blnLandscape)
			this.panelHeight = this.options.landscapeMaxHeight > this.mobileNavInside.getStyle('height').toInt() ? this.mobileNavInside.getStyle('height').toInt() : this.options.landscapeMaxHeight;
		else
			this.panelHeight = this.options.portraitMaxHeight > this.mobileNavInside.getStyle('height').toInt() ? this.mobileNavInside.getStyle('height').toInt() : this.options.portraitMaxHeight;
		
		var insidePadding = parseInt(this.mobileNavInside.getStyle('padding-top') + this.mobileNavInside.getStyle('padding-bottom'));
		this.panelHeight -= insidePadding;
		
		// Resize
		this.panels.each( function(panel,idx){
		
			//Account for padding
			var panelPadding = parseInt(panel.getStyle('padding-right')) + parseInt(panel.getStyle('padding-left'));
			
			panel.setStyles({
				width: this.panelWidth - panelPadding,
				height: this.panelHeight,
				float: 'left'
			});
		}.bind(this));
		
		this.totalWidth = this.panelWidth*this.panels.length+(10*this.panels.length);
		this.element.setStyles({width: this.totalWidth, height: this.panelHeight});
		
	},
	
	resetLeftPosition: function()
	{
		var intLeft = (this.panelWidth * this.currentIndex) * -1;
		this.element.setStyle('left', intLeft.toString() + 'px');
	}
	
});
