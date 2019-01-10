(function () {
	'use strict';

	let form_changed = false;

	function cl( data, clear ) {
		if ( true === clear ) {
			console.clear();
		}
		console.log( data );
	}

	/**
	 * Serialize form to an object including empty fields.
	 * defineProperty - to avoid jQuery conflict.
	 */
	Object.defineProperty( Object.prototype, 'serializeObject', {
		value : function ( format ) {
			let inputs = this.querySelectorAll( '[name]' );
			let obj    = {};
			let arr    = [];
			let s      = [];
			let a      = [];
			let out;
			let val;

			for ( let i in inputs ) {
				if ( inputs.hasOwnProperty( i ) ) {
					let that = inputs[ i ];

					val = that.value ? that.value : '';
					if ( undefined !== that.getAttribute( 'type' ) && 'checkbox' === that.getAttribute( 'type' ) ) {

						if ( that.checked ) {
							arr.push( { name : that.getAttribute( 'name' ), value : val } );
						} else {
							arr.push( { name : that.getAttribute( 'name' ), value : '' } );
						}
					} else {
						if ( undefined !== that.getAttribute( 'multiple' ) ) {
							if ( null === val ) {
								arr.push( { name : that.getAttribute( 'name' ), value : '' } );
							} else {
								arr.push( { name : that.getAttribute( 'name' ), value : val } );
							}
						} else {
							arr.push( { name : that.getAttribute( 'name' ), value : val } );
						}
					}
				}
			}

			// turn to associative array
			for ( let i in arr ) {
				if ( arr.hasOwnProperty( i ) ) {

					// if we haven't an object item with that name
					if ( undefined === obj[ arr[ i ].name ] ) {

						// set simple value at the first time for that name
						obj[ arr[ i ].name ] = arr[ i ].value;
					} else {

						// if it is not an array yet
						if ( !Array.isArray( obj[ arr[ i ].name ] ) ) {

							// make an array from simple value
							obj[ arr[ i ].name ] = [ obj[ arr[ i ].name ] ];
						}
						obj[ arr[ i ].name ].push( arr[ i ].value );
					}
				}
			}

			if ( 'string' === format || 'attributes' === format ) {

				// build query
				for ( let key in obj ) {
					if ( obj.hasOwnProperty( key ) ) {
						let value = obj[ key ];
						if ( true === Array.isArray( value ) ) {
							value = value.join( ',' );
						}
						s.push( key + '=' + value );
						a.push( key + '="' + value + '"' );
					}
				}
			}

			// choose output format
			switch ( format ) {
				case 'string':
					out = encodeURI( s.join( '&' ) );
					break;
				case 'attributes':
					out = a.join( ' ' );
					break;
				case 'array':
					out = arr;
					break;
				default:
					out = obj;
			}

			return out;
		},
		enumerable : false
	} );


	function on( e, selector, func ) {
		e = e.split( ' ' );
		//console.log( e );
		for ( let i = 0, count = e.length; i < count; i++ ) {
			document.addEventListener( e[ i ], function ( event ) {

				// if cart button clicked
				if ( event.target.closest( selector ) !== null ) {

					func( event, selector );
				}
			} );
		}
	}


	/**
	 * Function, that put the data to template block, and return complete HTML.
	 *
	 * @param str
	 * @param data
	 * @returns {Function}
	 */
	function tmpl( str, data ) {
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		let fn = !/\W/.test( str ) ?
			cache[ str ] = cache[ str ] ||
				tmpl( document.getElementById( str ).innerHTML ) :

			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			new Function( "obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +

				// Introduce the data as local variables using with(){}
				"with(obj){p.push('" +

				// Convert the template into pure JavaScript
				str
				//.toString()
					.replace( /[\r\t\n]/g, " " )
					.split( "<%" ).join( "\t" )
					.replace( /((^|%>)[^\t]*)'/g, "$1\r" )
					.replace( /\t=(.*?)%>/g, "',$1,'" )
					.split( "\t" ).join( "');" )
					.split( "%>" ).join( "p.push('" )
					.split( "\r" ).join( "\\'" )
				+ "');}return p.join('');" );
		// Provide some basic currying to the user
		return data ? fn( data ) : fn;
	}

	/**
	 * Get request.
	 *
	 * @param options
	 * @returns {Promise<string>}
	 */
	function ajax( options ) {
		return new Promise( function ( resolve, reject ) {
			let xhr    = new XMLHttpRequest();
			let params = options.data;
			let url    = options.url;
			// We'll need to stringify if we've been given an object
			// If we have a string, this is skipped.
			if ( params && 'object' === typeof params ) {
				params = Object.keys( params ).map( function ( key ) {
					return encodeURIComponent( key ) + '=' + encodeURIComponent( params[ key ] );
				} ).join( '&' );
			} else {
				params = '';
			}

			if ( params && 'POST' !== options.method ) {
				url = options.url + '?' + params;
			}

			xhr.open( options.method, url );
			xhr.onload  = function () {
				if ( this.status >= 200 && this.status < 300 ) {
					resolve( xhr.response );
				} else {
					reject( {
						status : this.status,
						statusText : xhr.statusText
					} );
				}
			};
			xhr.onerror = function () {
				reject( {
					status : this.status,
					statusText : xhr.statusText
				} );
			};
			if ( 'POST' === options.method ) {
				xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
			}
			if ( options.headers ) {
				Object.keys( options.headers ).forEach( function ( key ) {
					xhr.setRequestHeader( key, options.headers[ key ] );
				} );
			}

			xhr.send( params );
		} );
	}

	/* --------------------------- */


	function get_phrases( event ) {
		event.preventDefault();
		let form = event.target;
		let text = form.querySelector( 'textarea' ).value;
		cl( text );
		text = text.split( "\n" );

		text.forEach( function ( line, i ) {
			text[ i ] = line.trim();
		} );
		text = text.filter( line => line.length > 0 );

		let list = document.querySelector( '.js-phases-list' );

		text.forEach( function ( phrase ) {
			list.innerHTML += ('<li class="list__item hidden js-slide">' + phrase + '</li>');
		} );

		let elements = list.querySelectorAll( '.js-slide' );
		elements[ 0 ].classList.remove( 'hidden' );

		cl( text );
	}

	function slideGo( selector ) {
		let slider = document.querySelector( selector );
		let nextslide = slider.getAttribute('data-active-slide');
		if(undefined===nextslide){
			nextslide = 0;
		}else{
			nextslide++;
		}


		let slides = slider.querySelectorAll( '.js-slide' );
		slides.forEach( function ( slide, i ) {
			slides[ i ].classList.add( 'hidden' );
		} );
		slides[ nextslide ].classList.remove( 'hidden' );
		slider.setAttribute( 'data-active-slide', nextslide );
	}

	function nextSlide( event ) {
		let button = event.target;

		let slider_selector = button.getAttribute( 'data-slider' );
		let slider = document.querySelector('.'+slider_selector);
		cl(slider);
		let slides_count = slider.querySelectorAll('.js-slide').length;
		let nextslide = slider.getAttribute('data-active-slide');
		cl(slides_count);
		cl(nextslide);
		if(slides_count<nextslide){
			button.classList.add('hidden');
		}else{
			slideGo( '.' + slider_selector );
		}
	}

	on( 'submit', '.js-phrases-text', get_phrases );
	on( 'click', '[data-slider]', nextSlide );


}());


