/**
 * Contao Open Source CMS
 * Copyright (C) 2005-2011 Leo Feyer
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
 * @copyright  Winans Creative 2010
 * @author     Blair Winans <blair@winanscreative.com>
 * @license    http://opensource.org/licenses/lgpl-3.0.html
 */


var MobileMenu = new Class(
{
	Implements: Options,
	options: {
		wrapper: 	'mobilenav',
		startlevel: 1,
		forceSlide: false
	},
	
	initialize: function(options)
	{
		this.setOptions(options);
		//Set start level visibility
		this.navcontainer = $(this.options.wrapper);
		var mainLink = this.navcontainer.getElements('a.Action').each( function(main)
		{
			main.addEvent('click', function() {
				return false;
			});
		});
		this.activeLevel = this.navcontainer.getElements('ul.level_'+this.options.startlevel);
		this.activeLevel.setStyle('display','block');
		
		var slideLink;
		
		//Add in links for the sliders if items have submenu class (Contao default)
		var submenuLinks = this.navcontainer.getElements('li.submenu').each( function(el) {
			if(this.options.forceSlide==true)
			{
				slideLink = el.getElement('a');
			}
			else
			{
				el.getElement('a').setStyle('width','85%');
				slideLink = new Element('a').setProperties({href: '#', html: '&nbsp;'}).setStyle('width','13%').inject(el);
			}
			slideLink.addClass('arrow');
			slideLink.addEvent('click', function(event) {
				this.slideNav(event);
				return false;
			}.bind(this));
		}.bind(this));
		
	},
	
	slideNav: function(event)
	{
		var regul = /\blevel_[0-9]\b/;
		var el = event.target;
		//Get parent li
		var parentLI = el.getParent('li');
		//get parent li uniqid class array
		var arrLIClass = parentLI.get('class').split(" ");
		//Get parent ul
		var parentUL = parentLI.getParent('ul');
		//Get parent ul level class
		var parentClass = parentUL.get('class');	
		var level = regul.exec(parentClass);
		var nextlevel = (level[0].substr(-1).toInt())+1;
		$$('ul.level_'+nextlevel).each( function(child) {
			var arrChildClass = child.get('class').split(" ");
			if(this.arrayIntersect(arrChildClass, arrLIClass)[0].length > 0)
			{
				var parentSize = parentUL.getSize();
				child.setStyles({left:parentSize.x+'px',display:'block'});
				child.morph({left:10, right:0});
				parentUL.morph({left:'-'+parentSize.x+'px',right:(parentSize.x+10)+'px'});
				
				//Set the back button
				if(!this.backLink)
				{
					var header = this.navcontainer.getElements('div.toggler').each( function(el) {
						this.backLink = new Element('a').setProperties({href: '#',id:'backButton',html:'Back'}).inject(el);
					}.bind(this));
				}
				this.backLink.show();
				this.backLink.removeEvents();
				this.backLink.addEvent('click', function(event) {
					this.backNav(parentUL,child);
					return false;
				}.bind(this));
			}
		}.bind(this));
	},
	
	backNav: function(parentUL,child)
	{
		var regul = /\blevel_[0-9]\b/;
		var parentClass = parentUL.get('class');	
		var level = regul.exec(parentClass);
		var currlevel = level[0].substr(-1).toInt();
		
		var childSize = child.getSize();
		parentUL.setStyles({left:'-'+childSize.x+'px',display:'block'});
		parentUL.morph({left:10, right:0});
		child.morph({left:(childSize.x+50)+'px',right:'-'+(childSize.x+50)+'px'});
		if(currlevel==1)
		{
			this.backLink.hide();
		}
		else
		{
			//Find the parent of the current level
			var parentlevel = currlevel-1;
			var arrChildClass = parentUL.get('class').split(" ");
			$$('ul.level_'+parentlevel).each( function(parent) {
				var arrParentLIs = parent.getChildren('li').each(function(parentLI) {
					var arrLIClass = parentLI.get('class').split(" ");
					if(this.arrayIntersect(arrChildClass, arrLIClass)[0].length > 0)
					{
						//Set the back button
						if(!this.backLink)
						{
							var header = this.navcontainer.getElements('div.toggler').each( function(el) {
								this.backLink = new Element('a').setProperties({href: '#',id:'backButton',html:'Back'}).inject(el);
							}.bind(this));
						}
						this.backLink.removeEvents();
						this.backLink.addEvent('click', function(event) {
							this.backNav(parent,parentUL);
							return false;
						}.bind(this));
					}
				}.bind(this));
			}.bind(this));
		}
	},
	
	arrayIntersect: function (array1, array2) {
	    var common = new Array();
		var n = -1;
		for (var i = 0 in array1) {
			if (this.inArray(array1[i], array2) == true) {
				n++;
				common[n] = (array1[i]);
			}
		}
		return common;
	},
	
	inArray: function (value, array) {
		for (var i = 0 in array) {
			if (array[i] == value) {
				return true;
			}
		}
		return false;
	}
});

