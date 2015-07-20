import Qajax = require('qajax');

type DemoArrivalTime = {
  stopId: string;
  stopName: string;
  arrival: number;
  departure: number;
  tripId: string;
  pos: number;
  lat: number;
  lng: number;
}

const baseURL = '';
const defaultTimeout = 30 * 1000;

export function gitVersion(success: (sha: string) => void, error: (err: string) => void): void {
  const endpoint = baseURL + '/about';
  Qajax({ url: endpoint, timeout: defaultTimeout })
      .then(Qajax.filterSuccess)
      .then(response => Qajax.toJSON<{cheminotc: string}>(response))
      .then(result => success(result.cheminotc))
      .catch(e => error(e));
}

export function init(success: (meta: Meta) => void, error: (err: string) => void): void {
  const endpoint = baseURL + '/cheminotm/init';
  Qajax({ url: endpoint, timeout: defaultTimeout })
      .then((response) => {
        var result: any;
        try { result = JSON.parse(response.responseText); } catch(e) {};
        if(response.status == 400 && result && result.error) {
          window.parent.postMessage({
            event: 'cheminot:init',
            error: result.error
          }, window.location.origin);
        }
        return response;
      })
      .then(Qajax.filterSuccess)
      .then(response => Qajax.toJSON<Meta>(response))
      .then(result => success(result))
      .catch(e => error(e));
}

export function lookForBestTrip(vsId: string, veId: string, at: Date, te: Date, max: number, success: (stopTimes: ArrivalTime[]) => void, error: (err: string) => void): void {

  const endpoint = baseURL + '/cheminotm/besttrip';
  const atTimestamp = Math.round(at.getTime() / 1000);
  const teTimestamp = Math.round(te.getTime() / 1000);

  Qajax({
    url: endpoint,
    method: 'POST',
    timeout: 3600 * 1000,
    data: {
      vsId: vsId,
      veId: veId,
      at: atTimestamp,
      te: teTimestamp,
      max: max
    }
  }).then(Qajax.filterSuccess)
    .then(response => {
      let trip: DemoArrivalTime[] = JSON.parse(response.responseText);
      if(trip) {
        success(trip.map(function(arrivalTime) {
          return {
            stopId: arrivalTime.stopId,
            stopName: arrivalTime.stopName,
            tripId: arrivalTime.tripId,
            pos: arrivalTime.pos,
            arrival: new Date(arrivalTime.arrival * 1000),
            departure: new Date(arrivalTime.departure * 1000),
            lat: arrivalTime.lat,
            lng: arrivalTime.lng
          };
        }));
      } else {
        error('aborted');
      }
    }).catch(response => {
      var r = JSON.parse(response.responseText);
      error(r.error);
    });
}

export function lookForBestDirectTrip(vsId: string, veId: string, at: Date, te: Date, success: (result: [boolean, ArrivalTime[]]) => void, error: (err: string) => void): void {

  const endpoint = baseURL + '/cheminotm/bestdirecttrip';
  const atTimestamp = Math.round(at.getTime() / 1000);
  const teTimestamp = Math.round(te.getTime() / 1000);

  Qajax({
    url: endpoint,
    method: 'POST',
    timeout: defaultTimeout,
    data: {
      vsId: vsId,
      veId: veId,
      at: atTimestamp,
      te: teTimestamp
    }
  }).then(Qajax.filterSuccess)
    .then(response => {
      let result: {hasDirect: boolean, arrivalTimes: DemoArrivalTime[]} = JSON.parse(response.responseText);
      success([result.hasDirect, result.arrivalTimes.map(function(arrivalTime) {
        return {
          stopId: arrivalTime.stopId,
          stopName: arrivalTime.stopName,
          tripId: arrivalTime.tripId,
          pos: arrivalTime.pos,
          arrival: new Date(arrivalTime.arrival * 1000),
          departure: new Date(arrivalTime.departure * 1000),
          lat: arrivalTime.lat,
          lng: arrivalTime.lng
        };
      })]);
    })
    .catch(e => error(e));
}

export function abort(success: () => void, error: (err: string) => void): void {
  const endpoint = baseURL + '/cheminotm/abort';
  Qajax({
    url: endpoint,
    method: 'POST',
    timeout: defaultTimeout
  }).then(Qajax.filterSuccess)
    .then(() => {
      window.parent.postMessage({
        event: 'cheminot:abort'
      }, window.location.origin);
    })
    .then(response => success())
    .catch(e => error(e));
}

var stream: EventSource;
var queue: Station[] = [];

function Stream(): EventSource {
  const endpoint = baseURL + '/cheminotm/trace';

  var stream = new EventSource(baseURL + '/cheminotm/trace');

  stream.onmessage = (msg) => {
    var data: Station[] = JSON.parse(msg.data);
    queue = queue.concat(data);
  };

  stream.onerror = (event: any) => {
    console.log(event);
  };

  return stream;
}

export function trace(success: (trace: Station[]) => void, error: (err: string) => void): void {
  if(!stream) stream = Stream();
  success(queue);
  queue = [];
}
