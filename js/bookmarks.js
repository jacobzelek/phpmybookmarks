function Bookmark()
{
	this.id = 0;
	this.url = "";
	this.title = "";
	this.tags = Array();
}

Bookmark.prototype.load = function(bookmark)
{
	this.id = bookmark.id;
	this.url = bookmark.url;
	this.title = bookmark.title;
	this.tags = bookmark.tags;
}

Bookmark.prototype.get_html = function()
{
	var html = "";

	html += '<tr>';
	html += '<td>';

	html += '<a class="btn btn-mini edit-tags" id="edit_tag_' +
	this.id + '" href="#"><i class="icon-tag"></i></a>&nbsp;';
	
	html += '<a class="btn btn-mini remove" id="remove_' + this.id +
			'" href="#"><i class="icon-remove"></i></a>&nbsp;&nbsp;';

	html += '<a target="_NEW" class="title" href="' + this.url + ' ">';
	html += this.title;
	html += '</a>';
	
	for(var i=0; i < this.tags.length; i++)
	{
		html += "&nbsp;&nbsp;<a class=\"label tag\">" +
					this.tags[i] + "</a>";
	}
	
	html += '</td>';
	html += '</tr>';

	return html;
}

function Bookmarks() { }

Bookmarks.init = function()
{
	Bookmarks.current_id = 0;

	Bookmarks.count = 0;
	Bookmarks.bookmarks = Array();
	Bookmarks.more = false;

	Bookmarks.tags = Array();
	Bookmarks.search = "";
	Bookmarks.limit = 100;
}

Bookmarks.remove_tag = function(tag)
{
	if(Bookmarks.tags.in_array(tag, false))
	{
		Bookmarks.tags.remove(
			Bookmarks.tags.indexOf(tag));
	}
}

Bookmarks.clear_search = function()
{
	Bookmarks.limit = 100;
	Bookmarks.search = "";
	Bookmarks.tags = Array();
} 

Bookmarks.fetch = function()
{
	var request_data = {
						action: "get_bookmarks",
						limit: Bookmarks.limit,
						search: Bookmarks.search,
						tags: Bookmarks.tags.join(":")
						};
	
	Server.send_request(function(response)
	{
		Bookmarks.more = response.more;
		Bookmarks.count = response.result_count;
		Bookmarks.bookmarks = Array();
		
		var count = response.bookmarks.length;
		
		for(var i=0; i < count; i++)
		{
			var bookmark = new Bookmark();
			bookmark.load(response.bookmarks[i]);
			Bookmarks.bookmarks.push(bookmark);
		}
		
		Bookmarks.display();
	},
	request_data);
}

/*
 * @todo Write
 */
Bookmarks.fetch_single = function(bookmark_id)
{
	var request_data = {
						get_bookmark: 1
						};
	
	Server.send_request(function(response)
	{
		Bookmarks.more = response.more;
		Bookmarks.count = response.result_count;
		Bookmarks.bookmarks = Array();
		
		var count = response.bookmarks.length;
		
		for(var i=0; i < count; i++)
		{
			var bookmark = new Bookmark();
			bookmark.load(response.bookmarks[i]);
			Bookmarks.bookmarks.push(bookmark);
		}
		
		Bookmarks.display();
	},
	request_data);
}

/**
 * Queries for latest id. If newer bookmarks exist, update screen
 * 
 * @todo If new items query and add only new items without full refresh
 */
Bookmarks.refresh = function()
{
	var request_data = {
				action: "get_current_id"
			};

	Server.send_request(function(response)
	{
		if(response.id != Bookmarks.current_id)
		{
			Bookmarks.current_id = response.id;
			Bookmarks.fetch();
		}
	},
	request_data);
}

/*
 * Display current bookmarks
 */
Bookmarks.display = function()
{	
	var html = "";

	// If there are search or tag terms
	if(Bookmarks.search !="" ||
			Bookmarks.tags != "")
	{
	
		html += "<div class=\"well\">";
		html += "<small>Search Parameters (Click to unselect)</small><br />";

		if(Bookmarks.search != "")
		{
			html += "<a class=\"label label-info clear-search\">" +
				"Search: " +
				Bookmarks.search + "</a>&nbsp;&nbsp;";
		}
		
		if(Bookmarks.tags != "")
		{
			for(var i=0; i < this.tags.length; i++)
			{
				html += "<a class=\"label clear-tag\">" +
							this.tags[i] + "</a>&nbsp;&nbsp;";
			}
		}
		
		html += "</div>";
	}
	
	if(Bookmarks.count > 0)
	{	
		html += '<table class="table table-hover table-condensed"><tbody>';
		
		for(i=0; i < Bookmarks.bookmarks.length; i++)
		{
			html += Bookmarks.bookmarks[i].get_html();
		}

		html += '</tbody></table>';
		
		html += '<a rel="bookmark_ending"></a>';

		if(Bookmarks.more)
		{
			html += '<button class="more btn btn-info btn-block">View More</button><br />';
		}
	}
	else
	{
		html += '<strong>No Bookmarks Found!</strong>';
	}
	
	// Display bookmarks HTML
	Display.set_main(html);
	
	/**
	 * Handles more bookmarks button
	 */
	$(".more").click(
	function(e)
	{
		e.preventDefault();
		Bookmarks.limit = Bookmarks.limit + 100;
		Bookmarks.fetch();
	});
	
	/**
	 * Handles remove bookmark button
	 */
	$(".remove").click(
	function(e)
	{
		e.preventDefault();

		// Get id of bookmark
		bookmark_id = $(this).attr('id').split("_")[1];
		element_id = $(this).attr('id');
		
		var request_data = {
				action: "remove_bookmark",
				id: bookmark_id
				};

		Server.send_request(function(response)
		{
			//@todo Tie into new update system
			$("#" + element_id).parent()
				.parent().remove();
		},
		request_data);
	});
	
	/**
	 * Handles edit tags button
	 */
	$(".edit-tags").click(
	function(e)
	{
		e.preventDefault();

		// Get id of bookmark
		bookmark_id = $(this).attr('id').split("_")[2];
		
		/*
		 * Get bookmark title
		 * @todo This can be a lot more flexible and cleaner somehow
		 */
		bookmark_title = $(this).parent("td").children(".title").html();
		
		var tags = Array();
		
		/*
		 * Get bookmarks tags
		 * @todo This can be a lot more flexible and cleaner somehow
		 */
		$(this).parent("td").children(".tag").each(function()
		{
			tags.push($(this).html());
		});
		
		Tag_Editor.display(bookmark_id, bookmark_title, tags);
	});
	
	/**
	 * Handles tag clicks
	 */
	$(".tag").click(function(e)
	{
		e.preventDefault();

		tag = $(this).html();
		
		if(!Bookmarks.tags.in_array(tag, false))
		{
			Bookmarks.tags.push(tag);
			Bookmarks.fetch();
		}
	});
	
	/**
	 * Handles tag clicks in search parameters
	 */
	$(".clear-tag").click(function(e)
	{
		e.preventDefault();

		tag = $(this).html();
		
		if(Bookmarks.tags.in_array(tag, false))
		{
			Bookmarks.remove_tag(tag);
			Bookmarks.fetch();
		}
	});
	
	/**
	 * Handles tag clicks in search parameters
	 */
	$(".clear-search").click(function(e)
	{
		e.preventDefault();
		
		Bookmarks.search = "";
		Bookmarks.fetch();
	});
}