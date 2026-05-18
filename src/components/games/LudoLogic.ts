export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';
export type HorseStatus = 'home' | 'track' | 'finish_path' | 'finished';

export interface Horse {
  id: string; // "red_0"
  color: PlayerColor;
  status: HorseStatus;
  position: number; // 0-51 if track, 0-5 if finish_path
}

export const TRACK = [{"x":0,"y":6},{"x":1,"y":6},{"x":2,"y":6},{"x":3,"y":6},{"x":4,"y":6},{"x":5,"y":6},{"x":6,"y":5},{"x":6,"y":4},{"x":6,"y":3},{"x":6,"y":2},{"x":6,"y":1},{"x":6,"y":0},{"x":7,"y":0},{"x":8,"y":0},{"x":8,"y":1},{"x":8,"y":2},{"x":8,"y":3},{"x":8,"y":4},{"x":8,"y":5},{"x":9,"y":6},{"x":10,"y":6},{"x":11,"y":6},{"x":12,"y":6},{"x":13,"y":6},{"x":14,"y":6},{"x":14,"y":7},{"x":14,"y":8},{"x":13,"y":8},{"x":12,"y":8},{"x":11,"y":8},{"x":10,"y":8},{"x":9,"y":8},{"x":8,"y":9},{"x":8,"y":10},{"x":8,"y":11},{"x":8,"y":12},{"x":8,"y":13},{"x":8,"y":14},{"x":7,"y":14},{"x":6,"y":14},{"x":6,"y":13},{"x":6,"y":12},{"x":6,"y":11},{"x":6,"y":10},{"x":6,"y":9},{"x":5,"y":8},{"x":4,"y":8},{"x":3,"y":8},{"x":2,"y":8},{"x":1,"y":8},{"x":0,"y":8},{"x":0,"y":7}];

export const STARTS: Record<PlayerColor, number> = {
  red: 1,
  green: 14,
  blue: 27,
  yellow: 40
};

export const FINISH_STARTS: Record<PlayerColor, number> = {
  // the index on the track where the horse must turn into the finish path
  red: 0,
  green: 13,
  blue: 26,
  yellow: 39
};

export const FINISH_PATHS: Record<PlayerColor, {x: number, y: number}[]> = {
  red:    [{x:1,y:7}, {x:2,y:7}, {x:3,y:7}, {x:4,y:7}, {x:5,y:7}, {x:6,y:7}],
  green:  [{x:7,y:1}, {x:7,y:2}, {x:7,y:3}, {x:7,y:4}, {x:7,y:5}, {x:7,y:6}],
  blue:   [{x:13,y:7},{x:12,y:7},{x:11,y:7},{x:10,y:7},{x:9,y:7}, {x:8,y:7}],
  yellow: [{x:7,y:13},{x:7,y:12},{x:7,y:11},{x:7,y:10},{x:7,y:9}, {x:7,y:8}]
};

export const HOME_ZONES: Record<PlayerColor, {x: number, y: number}[]> = {
  red:    [{x:2,y:2}, {x:3,y:2}, {x:2,y:3}, {x:3,y:3}],
  green:  [{x:11,y:2},{x:12,y:2},{x:11,y:3},{x:12,y:3}],
  blue:   [{x:11,y:11},{x:12,y:11},{x:11,y:12},{x:12,y:12}],
  yellow: [{x:2,y:11},{x:3,y:11},{x:2,y:12},{x:3,y:12}]
};

export function getHorseCoords(horse: Horse): {x: number, y: number} {
  if (horse.status === 'home') {
    const idx = parseInt(horse.id.split('_')[1], 10);
    return HOME_ZONES[horse.color][idx];
  }
  if (horse.status === 'track') {
    return TRACK[horse.position];
  }
  if (horse.status === 'finish_path' || horse.status === 'finished') {
    return FINISH_PATHS[horse.color][horse.position];
  }
  return {x: 0, y: 0};
}
