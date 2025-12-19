'use client'

import React, {useEffect} from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export function Map () {
    const mapRef = React.useRef(null);

    useEffect (() => {
        const initMap = async () =>  {
            const loader = new Loader({
                apiKey: process.env.GOOGLE_MAPS_API_KEY as string,
                version: 'weekly'

            })

            const {Map} = await loader.importLibrary('maps');

            const position = {
                lat: 43.642693,
                lng: -79.3871189
            }

            const mapOptions: google.maps.MapOptions = {
                center: position,
                zoom: 17,
                mapId: 'MY_NEXTJS_MAPID'
            }

            if (mapRef.current) {
                new Map(mapRef.current as HTMLDivElement, mapOptions);
            }
        }

        initMap()
    }, [])
}