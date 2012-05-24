<?php if (!defined('TL_ROOT')) die('You cannot access this file directly!');

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
 * Class ModuleMobileNavigation
 *
 * Front end module "mobilenavigation".
 *
 * @copyright  Winans Creative 2012
 * @author     Blair Winans <blair@winanscreative.com>
 * @author     Adam Fisher <adam@winanscreative.com>
 * @package    Module
 */
class ModuleMobileNavigation extends Module
{

	/**
	 * Template
	 * @var string
	 */
	protected $strTemplate = 'mod_mobilenavigation';
	
	/**
	 * Levelcount
	 * @var int
	 */
	protected $intLevelCount = 10;


	/**
	 * Do not display the module if there are no menu items
	 * @return string
	 */
	public function generate()
	{
		if (TL_MODE == 'BE')
		{
			$objTemplate = new BackendTemplate('be_wildcard');

			$objTemplate->wildcard = '### MOBILE NAVIGATION MENU ###';
			$objTemplate->title = $this->headline;
			$objTemplate->id = $this->id;
			$objTemplate->link = $this->name;
			$objTemplate->href = 'contao/main.php?do=themes&amp;table=tl_module&amp;act=edit&amp;id=' . $this->id;

			return $objTemplate->parse();
		}
		
		$strBuffer = parent::generate();
		return strlen($this->Template->items) ? $strBuffer : '';
	}


	/**
	 * Generate module
	 */
	protected function compile()
	{
		global $objPage;

		$trail = $objPage->trail;
		$level = ($this->levelOffset > 0) ? $this->levelOffset : 0;

		// Overwrite with custom reference page
		if ($this->defineRoot && $this->rootPage > 0)
		{
			$trail = array($this->rootPage);
			$level = 0;
		}

		$this->Template->request = $this->getIndexFreeRequest(true);
		$this->Template->skipId = 'skipNavigation' . $this->id;
		$this->Template->menu = $GLOBALS['TL_LANG']['MSC']['menu'];
		$this->Template->skipNavigation = specialchars($GLOBALS['TL_LANG']['MSC']['skipNavigation']);
		$this->Template->items = $this->renderMobileNavigation($trail[$level]);
		
		
		$GLOBALS['TL_CSS'][] = 'system/modules/mobilenavigation/html/mobilenavigation.css';
		$GLOBALS['TL_JAVASCRIPT'][] = 'system/modules/mobilenavigation/html/mobilenavigation.js';
		$GLOBALS['TL_MOOTOOLS'][] = '<script type="text/javascript">
		/* <![CDATA[ */
		var objMobNav' . $this->id . ' = null;
		window.addEvent(\'domready\', function() {
			objMobNav' . $this->id . ' = new MobileNavigation();
		});
		/* ]]> */
		</script>'."\n";
	}
	
	/**
	 * Recursively compile the navigation menu and return it as HTML string
	 * NOTE: This is almost exactly the same as the core "renderNavigation" method
	 *
	 * @param integer
	 * @param integer
	 * @return string
	 */
	protected function renderMobileNavigation($pid, $level=1, $uniqid='')
	{
		$time = time();

		// Get all active subpages
		$objSubpages = $this->Database->prepare("SELECT p1.*, (SELECT COUNT(*) FROM tl_page p2 WHERE p2.pid=p1.id AND p2.type!='root' AND p2.type!='error_403' AND p2.type!='error_404'" . (!$this->showHidden ? (($this instanceof ModuleSitemap) ? " AND (p2.hide!=1 OR sitemap='map_always')" : " AND p2.hide!=1") : "") . ((FE_USER_LOGGED_IN && !BE_USER_LOGGED_IN) ? " AND p2.guests!=1" : "") . (!BE_USER_LOGGED_IN ? " AND (p2.start='' OR p2.start<".$time.") AND (p2.stop='' OR p2.stop>".$time.") AND p2.published=1" : "") . ") AS subpages FROM tl_page p1 WHERE p1.pid=? AND p1.type!='root' AND p1.type!='error_403' AND p1.type!='error_404'" . (!$this->showHidden ? (($this instanceof ModuleSitemap) ? " AND (p1.hide!=1 OR sitemap='map_always')" : " AND p1.hide!=1") : "") . ((FE_USER_LOGGED_IN && !BE_USER_LOGGED_IN) ? " AND p1.guests!=1" : "") . (!BE_USER_LOGGED_IN ? " AND (p1.start='' OR p1.start<".$time.") AND (p1.stop='' OR p1.stop>".$time.") AND p1.published=1" : "") . " ORDER BY p1.sorting")
									  ->execute($pid);
		
		$objParentPage = $this->Database->prepare("SELECT * FROM tl_page WHERE id=?")->limit(1)->execute($pid);

		if ($objSubpages->numRows < 1)
		{
			return '';
		}

		$items = array();
		$groups = array();

		// Get all groups of the current front end user
		if (FE_USER_LOGGED_IN)
		{
			$this->import('FrontendUser', 'User');
			$groups = $this->User->groups;
		}

		// Layout template fallback
		if (!strlen($this->navigationTpl))
		{
			$this->navigationTpl = 'nav_mobile';
		}

		$objTemplate = new FrontendTemplate('nav_mobile');

		$objTemplate->type = get_class($this);
		$objTemplate->level = 'level_' . $level++;
		$objTemplate->uniqClass = $uniqid;
		
		$subitems = '';

		// Get page object
		global $objPage;

		// Browse subpages
		while($objSubpages->next())
		{
			$strUniqID = '';
			$this->intLevelCount = $objSubpages->subpages > $this->intLevelCount ? $objSubpages->subpages : $this->intLevelCount;
		
			// Skip hidden sitemap pages
			if ($this instanceof ModuleSitemap && $objSubpages->sitemap == 'map_never')
			{
				continue;
			}

			$_groups = deserialize($objSubpages->groups);

			// Do not show protected pages unless a back end or front end user is logged in
			if (!$objSubpages->protected || BE_USER_LOGGED_IN || (is_array($_groups) && count(array_intersect($_groups, $groups))) || $this->showProtected || ($this instanceof ModuleSitemap && $objSubpages->sitemap == 'map_always'))
			{
				// Check whether there will be subpages
				if ($objSubpages->subpages > 0 && (!$this->showLevel || $this->showLevel >= $level || (!$this->hardLimit && ($objPage->id == $objSubpages->id || in_array($objPage->id, $this->getChildRecords($objSubpages->id, 'tl_page', true))))))
				{
					$strUniqID = uniqid();
					$subitems .= $this->renderMobileNavigation($objSubpages->id, $level, $strUniqID);
				}

				// Get href
				switch ($objSubpages->type)
				{
					case 'redirect':
						$href = $objSubpages->url;

						if (strncasecmp($href, 'mailto:', 7) === 0)
						{
							$this->import('String');
							$href = $this->String->encodeEmail($href);
						}
						break;

					case 'forward':
						if (!$objSubpages->jumpTo)
						{
							$objNext = $this->Database->prepare("SELECT id, alias FROM tl_page WHERE pid=? AND type='regular'" . (!BE_USER_LOGGED_IN ? " AND (start='' OR start<$time) AND (stop='' OR stop>$time) AND published=1" : "") . " ORDER BY sorting")
													  ->limit(1)
													  ->execute($objSubpages->id);
						}
						else
						{
							$objNext = $this->Database->prepare("SELECT id, alias FROM tl_page WHERE id=?")
													  ->limit(1)
													  ->execute($objSubpages->jumpTo);
						}

						if ($objNext->numRows)
						{
							$href = $this->generateFrontendUrl($objNext->fetchAssoc());
							break;
						}
						// DO NOT ADD A break; STATEMENT

					default:
						$href = $this->generateFrontendUrl($objSubpages->row());
						break;
				}

				// Active page
				if (($objPage->id == $objSubpages->id || $objSubpages->type == 'forward' && $objPage->id == $objSubpages->jumpTo) && !$this instanceof ModuleSitemap && !$this->Input->get('articles'))
				{
					$strClass = ($objSubpages->subpages > 0 ? 'submenu' : '') . (strlen($objSubpages->cssClass) ? ' ' . $objSubpages->cssClass : '');
					if (strlen($strUniqID))
					{
						$strClass .= ' '. $strUniqID;
					}
					$row = $objSubpages->row();

					$row['isActive'] = true;
					$row['uniqueId'] = $strUniqID;
					$row['submenu'] = ($objSubpages->subpages > 0 ? 'submenu' : '');
					$row['class'] = trim($strClass);
					$row['title'] = specialchars($objSubpages->title, true);
					$row['pageTitle'] = specialchars($objSubpages->pageTitle, true);
					$row['link'] = $objSubpages->title;
					$row['href'] = $href;
					$row['nofollow'] = (strncmp($objSubpages->robots, 'noindex', 7) === 0);
					$row['target'] = (($objSubpages->type == 'redirect' && $objSubpages->target) ? LINK_NEW_WINDOW : '');
					$row['description'] = str_replace(array("\n", "\r"), array(' ' , ''), $objSubpages->description);

					$items[] = $row;
				}

				// Regular page
				else
				{
					$strClass = ($objSubpages->subpages > 0 ? 'submenu' : '') . (strlen($objSubpages->cssClass) ? ' ' . $objSubpages->cssClass : '') . (in_array($objSubpages->id, $objPage->trail) ? ' trail' : '');

					// Mark pages on the same level (see #2419)
					if ($objSubpages->pid == $objPage->pid)
					{
						$strClass .= ' sibling';
					}
					
					if (strlen($strUniqID))
					{
						$strClass .= ' '. $strUniqID;
					}

					$row = $objSubpages->row();

					$row['isActive'] = false;
					$row['uniqueId'] = $strUniqID;
					$row['submenu'] = ($objSubpages->subpages > 0 ? 'submenu' : '');
					$row['class'] = trim($strClass);
					$row['title'] = specialchars($objSubpages->title, true);
					$row['pageTitle'] = specialchars($objSubpages->pageTitle, true);
					$row['link'] = $objSubpages->title;
					$row['href'] = $href;
					$row['nofollow'] = (strncmp($objSubpages->robots, 'noindex', 7) === 0);
					$row['target'] = (($objSubpages->type == 'redirect' && $objSubpages->target) ? LINK_NEW_WINDOW : '');
					$row['description'] = str_replace(array("\n", "\r"), array(' ' , ''), $objSubpages->description);

					$items[] = $row;
				}
			}
		}

		// Add classes first and last
		if (count($items))
		{
			$last = count($items) - 1;

			$items[0]['class'] = trim($items[0]['class'] . ' first');
			$items[$last]['class'] = trim($items[$last]['class'] . ' last');
		}

		$objTemplate->parentTitle = $objParentPage->title;
		$objTemplate->items = $items;
		$objTemplate->subitems = $subitems;
		return count($items) ? $objTemplate->parse() : '';
	}

	
	
}

?>