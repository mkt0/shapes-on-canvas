
$(function () {

	// initialize

	var canvas = document.getElementById('main_canvas'),
		ctx,
		now_drawing = false,
		interval_ms = 20,
		rad_per_step = Math.PI*0.01,
		distance_per_step = 3;	// pixcel
		
	if ( !canvas || !canvas.getContext ) {
		return false;
	};

	ctx = canvas.getContext('2d');

	// events

	$("#draw_entries_button").click( function (){

		var entry_ids = collect_entry_ids(),
			next_entry_index = 0,
			drawing_watcher = function () {
				var cur_entry_id,
					shape_type;

				if (now_drawing) {
					// do nothing
				} else{

					// check finish condition
					if (next_entry_index > entry_ids.length - 1) {
						clearInterval(drawing_watcher_intervalId);
						// console.log("finish.");
						return false;
					};

					// draw entry
					now_drawing = true;
					cur_entry_id = entry_ids[next_entry_index];
					shape_type = $(cur_entry_id + " .shape_selector").val();

					switch (shape_type) {
					case "circle":
						draw_circle_entry(cur_entry_id);
						break;
					case "line":
						draw_line_enrty(cur_entry_id);
						break;
					default:
						alert("invalid entry type: " + shape_type + "\n" + "next_entry_index: " + next_entry_index);
					}

					next_entry_index += 1;
				};
			},
			drawing_watcher_intervalId;

		drawing_watcher_intervalId = setInterval(drawing_watcher, 100);
	});
	
	$("#add_entry_button").click( function () {
		add_new_entry("circle");

		function add_new_entry (shape) {

			var new_entry_node,
				new_entry_num = $("#entries .entry").length + 1,
				entry_div = $("<div>").attr('id', "entry" + new_entry_num ).addClass('entry'),
				shape_selector = $("<select>", { name: "shape", "class": "shape_selector" } ),
				shape_options = ["circle", "line"],
				draw_entry_button = $("<button>", { "class": "btn draw-entry-button span1", text: "draw" } );

			add_option_to_selecter(shape_options, shape_selector);
			new_entry_node = $(entry_div).append(draw_entry_button).append(shape_selector);

			// shape-selectbox change event
			$(new_entry_node).appendTo("#entries");
			$("#entries .entry:last select.shape_selector").val(shape).on("change", function(ev) {
				change_entry_forms(this);
			}).trigger("change");

			// draw button click event
			$("#entries .entry:last button.draw-entry-button").on("click", function (ev) {
				var entry_id = "#" + $(this).parent().attr("id"),
					shape_type = $(entry_id + " .shape_selector").val();

				switch (shape_type) {
				case "circle":
					draw_circle_entry(entry_id, true);
					break;
				case "line":
					draw_line_enrty(entry_id, true);
					break;
				default:
					alert("invalid entry shape: " + shape_type + "\n" + "entry_id: " + entry_id);
				}
			});
		}

		function change_entry_forms (selectbox) {
			var shape = $(selectbox).val(),
				$entry = $(selectbox).parent(),
				input_circle_classes = ["center_x", "center_y", "radius"],
				input_circle_values = [75, 75, 75];
				input_circle_placeholders = ["X", "Y", "R"],
				selecter_classes = ["start_point", "direction"],
				point_options = ["top", "right", "bottom", "left"],
				direction_options = ["CW", "CCW"],
				input_line_classes = ["begin_x", "begin_y", "end_x", "end_y"],
				input_line_values = [0, 0, 150, 150],
				input_line_placeholders = ["X1", "Y1", "X2", "Y2"];


			switch (shape) {
			case "circle":
				$entry.find("input").remove();

				// add inputboxes
				for (var i = 0; i < input_circle_classes.length; i++) {
					$entry.append($("<input>", {
						"class": "span1 " + input_circle_classes[i],
						type: "text",
						value: input_circle_values[i],
						placeholder: input_circle_placeholders[i]
					}));
				};

				// add selectboxes
				for (var i = 0; i < selecter_classes.length; i++) {
					$entry.append($("<select>", {
						"class": selecter_classes[i],
						name: selecter_classes[i]
					}));
				};

				add_option_to_selecter(point_options, $entry.find("select.start_point"));
				add_option_to_selecter(direction_options, $entry.find("select.direction"));
				break;
			case "line":
				$entry.find("input").remove();
				$entry.find("select.start_point").remove();
				$entry.find("select.direction").remove();

				// add text input forms
				for (var i = 0; i < input_line_classes.length; i++) {
					$entry.append($("<input>", {
						"class": "span1 " + input_line_classes[i],
						type: "text",
						value: input_line_values[i],
						placeholder: input_line_placeholders[i]
					}));
				};
				break;
			default:
				console.log("shape value exception!");
			}

			// input value change event
			$entry.find("input").on("change", function (ev) {
				validate_user_input(this);
			});
		}

		function add_option_to_selecter (options, selector) {
			for (var i = options.length - 1; i >= 0; i--) {
				$(selector).append($("<option>", {
					value: options[i],
					text: options[i]
				}));
			};
		}
	});
	
	$("#remove_entry_button").click( function () {
		var $last_entry = $('#entries div[class^="entry"]:last');
		
		$last_entry.remove();
	});

	// add default entries

	$("#add_entry_button").trigger("click");
	$("#add_entry_button").trigger("click");
	$("#entries .entry:last .shape_selector").val("line").trigger("change");

	// drawing functions

	function draw_line_enrty (entry_id, noreplay) {
		var x1 = $(entry_id).find(".begin_x").val() * 1,
			y1 = $(entry_id).find(".begin_y").val() * 1,
			x2 = $(entry_id).find(".end_x").val() * 1,
			y2 = $(entry_id).find(".end_y").val() * 1,
			drawing_entry_index = $("div[class^='entry']").index($(entry_id)),
			interval_id = setInterval(draw_line_step, interval_ms),
			cur_x = x1,
			cur_y = y1,
			dx = x2 - x1,
			dy = y2 - y1,
			slope,
			dx_per_step,
			dy_per_step;

		if (dx === 0) {
			dx_per_step = 0;
			dy_per_step = distance_per_step;
		} else{
			slope = dy / dx;
			dx_per_step = Math.sqrt( Math.pow(distance_per_step, 2)  / (1 + Math.pow(slope, 2) ));
			dy_per_step = slope * dx_per_step;
		};

		function draw_line_step() {
			toggle_drawing_status(true);
			cur_x += dx_per_step;
			cur_y += dy_per_step;

			if (cur_x > x2 || cur_y > y2) {
				cur_x = x2;
				cur_y = y2;
				clearInterval(interval_id);
				now_drawing = false;
				toggle_drawing_status(false);
			};

			if (noreplay) {
				draw_line(x1, y1, cur_x, cur_y);
			} else{
				draw_line(x1, y1, cur_x, cur_y, drawing_entry_index);
			};
		}
	}

	function draw_circle_entry (entry_id, noreplay) {
		var x = $(entry_id + " .center_x").val() * 1,
			y = $(entry_id + " .center_y").val() * 1,
			r = $(entry_id + " .radius").val() * 1,
			startAngle = (function(){
				var start_point = $(entry_id + " .start_point").val();
				switch (start_point) {
				case "top":
					return Math.PI*1.5;
				case "left":
					return Math.PI;
				case "bottom":
					return Math.PI*0.5;
				case "right":
					return 0;
				default:
					alert("invalid start_point: " + start_point);
					console.log(entry_id);
				}
			})(),
			endAngle = startAngle + Math.PI*2,
			CCW = (function(){
				var direction = $(entry_id + " .direction").val();
				switch (direction) {
				case "CW":
					return false;
				case "CCW":
					return true;
				default:
					alert("invalid direction!");
				}
			})(),
			buf,
			cur_endAngle,
			interval_id,
			drawing_entry_index;

		if (noreplay != true) {
			drawing_entry_index = $("div[class^='entry']").index($(entry_id));
		};

		if (CCW) {
			// swap value between startAngle and endAngle
			buf = startAngle;
			startAngle = endAngle;
			endAngle = buf;
		};

		cur_endAngle = startAngle;
		interval_id = setInterval(draw_circle_step, interval_ms);

		function draw_circle_step () {
			toggle_drawing_status(true);
			if (CCW) {
				cur_endAngle -= rad_per_step;
				if (cur_endAngle < endAngle) {
					draw_arc(x, y, r, startAngle, endAngle, CCW, drawing_entry_index);
					clearInterval(interval_id);
					now_drawing = false;
					toggle_drawing_status(false);
				} else {
					draw_arc(x, y, r, startAngle, cur_endAngle, CCW, drawing_entry_index);
				};
			} else {
				cur_endAngle += rad_per_step;
				if (cur_endAngle > endAngle) {
					draw_arc(x, y, r, startAngle, endAngle, CCW, drawing_entry_index);	
					clearInterval(interval_id);
					now_drawing = false;
					toggle_drawing_status(false);
				} else {
					draw_arc(x, y, r, startAngle, cur_endAngle, CCW, drawing_entry_index);
				};
			};
		}
	}

	function draw_line (x1, y1, x2, y2, drawing_entry_index, noclear) {
		if (noclear != true) {
			clear_canvas();
		};
		if (drawing_entry_index != undefined){
			replay_before_entries(drawing_entry_index);
		};
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}

	function draw_arc (x, y, r, startAngle, endAngle, CCW, drawing_entry_index, noclear) {
		if (noclear != true) {
			clear_canvas();
		};
		if (drawing_entry_index != undefined) {
			replay_before_entries(drawing_entry_index);
		};
		ctx.beginPath();
		ctx.arc(x, y, r, startAngle, endAngle, CCW);
		ctx.stroke();
	}

	function replay_before_entries (now_drawing_entry_index) {
		var entry_ids = collect_entry_ids(),
			entry_id,
			shape;

		if (now_drawing_entry_index > 0) {

			for (var i = 0; i < now_drawing_entry_index; i++) {
				entry_id = entry_ids[i];
				shape = $(entry_id + " .shape_selector").val();

				switch (shape) {
				case "circle":
					replay_circle_entry(entry_id);
					break;
				case "line":
					replay_line_entry(entry_id);
					break;
				default:
					alert("invalid entry type: " + shape + "\n" + "entry_id_index: " + i);
				}
			};
		};
	}

	function replay_circle_entry (entry_id) {
		var x = $(entry_id + " .center_x").val() * 1,
			y = $(entry_id + " .center_y").val() * 1,
			r = $(entry_id + " .radius").val() * 1,
			startAngle = (function(){
				var start_point = $(entry_id + " .start_point").val();
				switch (start_point) {
				case "top":
					return Math.PI*1.5;
				case "left":
					return Math.PI;
				case "bottom":
					return Math.PI*0.5;
				case "right":
					return 0;
				default:
					alert("invalid start_point!");
				}
			})(),
			endAngle = startAngle + Math.PI*2,
			CCW = (function(){
				var direction = $(entry_id + " .direction").val();
				switch (direction) {
				case "CW":
					return false;
				case "CCW":
					return true;
				default:
					alert("invalid direction!");
				}
			})(),
			buf,
			noclear = true;

		if (CCW) {
			// swap value between startAngle and endAngle
			buf = startAngle;
			startAngle = endAngle;
			endAngle = buf;
		};

		draw_arc(x, y, r, startAngle, endAngle, CCW, undefined, noclear);
	}

	function replay_line_entry (entry_id) {
		var x1 = $(entry_id).find(".begin_x").val() * 1,
			y1 = $(entry_id).find(".begin_y").val() * 1,
			x2 = $(entry_id).find(".end_x").val() * 1,
			y2 = $(entry_id).find(".end_y").val() * 1,
			noclear = true;
		draw_line(x1, y1, x2, y2, undefined, noclear);
	}

	// helper functions

	function collect_entry_ids () {
		var $entries = $(".entry"),
			arr = [];
		$entries.each( function () {
			arr.push( "#" + $(this).attr("id") );
		});
		return arr;
	}

	function clear_canvas () {
		ctx.clearRect(0, 0, 150, 150);
	}

	function validate_user_input (input_elm) {
		var val = $(input_elm).val();

		if ( isFinite(val) ) {
			$(input_elm).removeClass("warning");
		} else{
			$(input_elm).val("").addClass("warning").focus();
		};
	}

	function toggle_drawing_status (switchOn) {
		if (switchOn) {
			$("div.status").toggleClass("hidden", false);
		} else{
			$("div.status").toggleClass("hidden", true);
		};
	}
});