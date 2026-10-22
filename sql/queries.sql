-- name: scenario_window
SELECT scenario_id, label, corridor
FROM REDTOWER.scenarios
WHERE scenario_id = :scenario_id

-- name: routes
SELECT route_id, corridor
FROM REDTOWER.routes
ORDER BY route_id

-- name: stops
SELECT stop_id, corridor, corridor_order, latitude, longitude
FROM REDTOWER.stops
ORDER BY corridor_order

-- name: stop_sequence
SELECT route_id, stop_id, sequence_order
FROM REDTOWER.stop_sequence
ORDER BY route_id, sequence_order

-- name: positions
SELECT
    scenario_id,
    vehicle_id,
    timestamp,
    route_id,
    nearest_stop,
    speed_kmh,
    latitude,
    longitude
FROM REDTOWER.vehicle_positions
WHERE scenario_id = :scenario_id
ORDER BY vehicle_id, timestamp

-- name: demand
SELECT
    scenario_id,
    stop_id,
    waiting_passengers,
    arrival_per_min,
    route_210_arrival_per_min
FROM REDTOWER.passenger_demand
WHERE scenario_id = :scenario_id
ORDER BY stop_id

-- name: reports
SELECT scenario_id, report_id, segment_id, description, reported_at
FROM REDTOWER.user_reports
WHERE scenario_id = :scenario_id
ORDER BY report_id

-- name: road_events
SELECT scenario_id, event_id, segment_id, type, severity
FROM REDTOWER.road_events
WHERE scenario_id = :scenario_id
ORDER BY event_id

-- name: cameras
SELECT scenario_id, camera_id, segment_id, state
FROM REDTOWER.cameras
WHERE scenario_id = :scenario_id
ORDER BY camera_id

-- name: weather
SELECT scenario_id, condition, observed_at
FROM REDTOWER.weather
WHERE scenario_id = :scenario_id

-- name: vehicles
SELECT vehicle_id, route_id, label
FROM REDTOWER.vehicles
ORDER BY vehicle_id
