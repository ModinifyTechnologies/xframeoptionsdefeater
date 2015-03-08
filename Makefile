all: install

clean:
	rm xframeoptionsdefeater.xpi

xframeoptionsdefeater.xpi: LICENSE bootstrap.js install.rdf chrome.manifest chrome/content/options.xul defaults/preferences/preferences.js
	zip xframeoptionsdefeater.xpi $^

install: xframeoptionsdefeater.xpi
	cp xframeoptionsdefeater.xpi /gidea/documents/public/xframeoptionsdefeater/

