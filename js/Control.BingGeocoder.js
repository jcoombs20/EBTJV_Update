L.Control.BingGeocoder = L.Control.extend({
	options: {
		collapsed: false,
		position: 'topright',
		text: 'Locate'
		/*callback: function (results) {
			var bbox = results.resourceSets[0].resources[0].bbox,
				first = new L.LatLng(bbox[0], bbox[1]),
				second = new L.LatLng(bbox[2], bbox[3]),
				bounds = new L.LatLngBounds([first, second]);
			this._map.fitBounds(bounds);
                     console.log(results.resourceSets[0].resources[0].address);
                     var tmpPoint = new L.marker(results.resourceSets[0].resources[0].point.coordinates).bindPopup(results.resourceSets[0].resources[0].address.formattedAddress);
                     this._map.addLayer(tmpPoint);
		}*/
	},

	_callbackId: 0,

	initialize: function (key, options) {
		this.key = key;
		L.Util.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;
		var className = 'leaflet-control-geocoder',
			container = this._container = L.DomUtil.create('div', className);

		L.DomEvent.disableClickPropagation(container);

		var form = this._form = L.DomUtil.create('form', className + '-form');
                form.title = "Enter location, address, or coordinates (lat, long) to which to zoom";

		var input = this._input = L.DomUtil.create('input', className + '-input', form);
		input.type = 'text';
                input.id = 'bingGeocoderInput';
                input.placeholder = 'Find location...';

		var submit = this._createButton(className, this.options.text);
                submit.title = "Click to zoom to specified location";
		form.appendChild(submit);

		L.DomEvent.on(form, 'submit', this._geocode, this);

		if (this.options.collapsed) {
			L.DomEvent.on(container, 'mouseover', this._expand, this);
			L.DomEvent.on(container, 'mouseout', this._collapse, this);

			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Bing Geocoder';

			L.DomEvent.on(link, L.Browser.touch ? 'click' : 'focus', this._expand, this);

			this._map.on('movestart', this._collapse, this);
		} else {
			this._expand();
		}

		container.appendChild(form);

		return container;
	},

	_createButton: function(css, text) {
		//var btn = '<button type="submit" class="' + css + '-button" />' + text + '</button>';
		var btn = '<button type="submit" id="bingGeocoderSubmit" class="fa fa-search"></button>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = btn;

		return radioFragment.firstChild;
	},

	_geocode : function (event) {
		L.DomEvent.preventDefault(event);
		this._callbackId = '_l_binggeocoder_' + (this._callbackId++);
		window[this._callbackId] = L.Util.bind(this.options.callback, this);

		var params = {
			query: this._input.value,
			key : this.key,
			jsonp : this._callbackId
		},
		url = 'https://dev.virtualearth.net/REST/v1/Locations' + L.Util.getParamString(params),
		script = L.DomUtil.create('script', '', document.getElementsByTagName('head')[0]);

		script.type = 'text/javascript';
		script.src = url;
		script.id = this._callbackId;
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-geocoder-expanded');
	},

	_collapse: function () {
		L.DomUtil.removeClass(this._container, 'leaflet-control-geocoder-expanded');
	}
});

L.control.bingGeocoder = function (key, options) {
		return new L.Control.BingGeocoder(key, options);
};