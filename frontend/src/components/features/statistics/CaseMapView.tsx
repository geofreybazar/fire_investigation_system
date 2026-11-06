import { useEffect } from "react";
import { Link } from "react-router";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGetMapPoints } from "@/hooks/statistics/useStatistics";
import type {
  MapPoint,
  StatisticsFilters,
} from "@/interface/statistics/statistics";
import { formatDateTime } from "@/utils/dateTime";
import { CaseStateBadge } from "@/components/features/cases/StatusBadges";
import { CASE_STATE_TONE } from "@/utils/statusTone";

// The whole Philippines when there is nothing to fit to.
const PHILIPPINES: [number, number] = [12.8797, 121.774];

// Zooms to the cases whenever the filters change what is shown.
const FitToPoints = ({ points }: { points: MapPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(PHILIPPINES, 6);
    } else if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 15);
    } else {
      map.fitBounds(
        points.map((point) => [point.latitude, point.longitude]),
        { padding: [32, 32], maxZoom: 15 },
      );
    }
  }, [map, points]);

  return null;
};

const CaseMapView = ({ filters }: { filters: StatisticsFilters }) => {
  const { points } = useGetMapPoints(filters);

  return (
    <div className='relative'>
      <MapContainer
        center={PHILIPPINES}
        zoom={6}
        scrollWheelZoom
        className='h-[65vh] min-h-[400px] w-full rounded-lg border'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <FitToPoints points={points} />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={9}
            pathOptions={{
              // Coloured by index.css, which can use the theme tokens.
              className: `case-marker case-marker--${CASE_STATE_TONE[point.state]}`,
            }}
          >
            <Popup>
              <div className='space-y-1.5'>
                <p className='font-semibold'>{point.caseNo}</p>
                <CaseStateBadge state={point.state} />
                <p>{point.category}</p>
                {point.place && <p>{point.place}</p>}
                <p>{formatDateTime(point.fireDate)}</p>
                <Link to={`/cases/${point.id}`}>Open case</Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {points.length === 0 && (
        <div className='pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center'>
          <p className='rounded-md border bg-background/95 px-3 py-2 text-sm text-muted-foreground shadow-sm'>
            No cases with coordinates match these filters.
          </p>
        </div>
      )}

      <p className='mt-2 text-xs text-muted-foreground'>
        {points.length} case{points.length === 1 ? "" : "s"} shown. Only cases
        with latitude and longitude appear on the map.
      </p>
    </div>
  );
};

export default CaseMapView;
