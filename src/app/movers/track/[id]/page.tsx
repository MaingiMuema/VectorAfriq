"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import toast from "react-hot-toast";
import { FiClock, FiMapPin, FiPhone, FiTruck } from "react-icons/fi";
import type { RelocationRequest } from "@/types/logistics";
import type { Libraries } from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "420px" };
const fallbackCenter = { lat: -1.2921, lng: 36.8219 };
const googleMapsLoaderId = "vectorafriq-google-maps";
const googleLibraries: Libraries = ["places"];

interface RouteSummary {
  distanceText: string;
  durationText: string;
}

export default function MoverTrackingPage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;
  const [request, setRequest] = useState<RelocationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  useEffect(() => {
    fetch("/api/logistics/config")
      .then((response) => response.json())
      .then((data) => setApiKey(data.googleMapsApiKey || ""))
      .catch(() => setApiKey(""));
  }, []);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/relocation-requests/${requestId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load request");
        setRequest(data.request);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load request");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
    const interval = window.setInterval(fetchRequest, 30000);
    return () => window.clearInterval(interval);
  }, [requestId]);

  const moverPosition = useMemo(() => {
    if (!request?.mover?.currentLatitude || !request.mover.currentLongitude) {
      return null;
    }

    return {
      lat: Number(request.mover.currentLatitude),
      lng: Number(request.mover.currentLongitude),
    };
  }, [request]);

  const pickupPosition = useMemo(() => {
    if (!request?.pickupLatitude || !request.pickupLongitude) return null;
    return {
      lat: Number(request.pickupLatitude),
      lng: Number(request.pickupLongitude),
    };
  }, [request]);

  const dropoffPosition = useMemo(() => {
    if (!request?.dropoffLatitude || !request.dropoffLongitude) return null;
    return {
      lat: Number(request.dropoffLatitude),
      lng: Number(request.dropoffLongitude),
    };
  }, [request]);

  const center = moverPosition || pickupPosition || dropoffPosition || fallbackCenter;
  const originPosition = moverPosition || pickupPosition;

  const updateRequest = async (action: string) => {
    try {
      const response = await fetch(`/api/relocation-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request update failed");
      setRequest(data.request);
      toast.success("Request updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 px-4">
        <div className="container mx-auto rounded-lg bg-white p-8 text-center text-gray-500">
          Loading relocation request...
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 px-4">
        <div className="container mx-auto rounded-lg bg-white p-8 text-center">
          <p className="text-gray-600">Request not found.</p>
          <Link href="/movers" className="mt-4 inline-block text-[#468AD1]">
            Back to movers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Relocation tracking
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Request #{request.id.slice(0, 8)} • {request.status}
              </p>
            </div>
            {request.mover && (
              <a
                href={`tel:${request.mover.contactPhone}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#468AD1] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2F6FAE]"
              >
                <FiPhone className="mr-2 h-5 w-5" />
                Call mover
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            {apiKey ? (
              <TrackingMap
                apiKey={apiKey}
                center={center}
                moverPosition={moverPosition}
                pickupPosition={pickupPosition}
                dropoffPosition={dropoffPosition}
                originPosition={originPosition}
                onRouteSummaryChange={setRouteSummary}
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-lg bg-gray-100 text-center text-gray-600">
                Map preview is unavailable. Trip details are shown beside it.
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Route</h2>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <p className="flex">
                  <FiMapPin className="mr-3 mt-0.5 text-[#468AD1]" />
                  <span>
                    <span className="block font-medium text-gray-900">Pickup</span>
                    {request.pickupLocation}
                  </span>
                </p>
                <p className="flex">
                  <FiMapPin className="mr-3 mt-0.5 text-[#514f63]" />
                  <span>
                    <span className="block font-medium text-gray-900">Dropoff</span>
                    {request.dropoffLocation}
                  </span>
                </p>
                <p className="flex">
                  <FiClock className="mr-3 mt-0.5 text-[#468AD1]" />
                  <span>
                    <span className="block font-medium text-gray-900">
                      Driving route
                    </span>
                    {routeSummary
                      ? `${routeSummary.distanceText} - ${routeSummary.durationText}`
                      : request.estimatedDurationMinutes
                        ? `${request.estimatedDurationMinutes} minutes after pickup`
                        : "Awaiting route estimate"}
                  </span>
                </p>
              </div>
            </div>

            {request.mover && (
              <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900">Mover</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">
                    {request.mover.businessName}
                  </p>
                  <p className="flex items-center">
                    <FiTruck className="mr-2 text-[#468AD1]" />
                    {request.mover.vehicleType} • {request.mover.vehiclePlate}
                  </p>
                  <p>
                    Last location:{" "}
                    {request.mover.lastLocationUpdate
                      ? new Date(request.mover.lastLocationUpdate).toLocaleString()
                      : "Not updated yet"}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Pricing</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Estimate</dt>
                  <dd className="font-medium">
                    KES {Number(request.estimatedPrice || 0).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Your offer</dt>
                  <dd className="font-medium">
                    KES {Number(request.userOfferedPrice || 0).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Mover counter</dt>
                  <dd className="font-medium">
                    KES {Number(request.moverCounterPrice || 0).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="text-gray-900">Agreed</dt>
                  <dd className="font-semibold text-gray-900">
                    KES {Number(request.agreedPrice || 0).toLocaleString()}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-col gap-2">
                {request.status === "COUNTERED" && (
                  <button
                    type="button"
                    onClick={() => updateRequest("agree_counter")}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Agree counter price
                  </button>
                )}
                {!["DELIVERED", "CANCELLED", "REJECTED"].includes(
                  request.status
                ) && (
                  <button
                    type="button"
                    onClick={() => updateRequest("cancel")}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel request
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TrackingMap({
  apiKey,
  center,
  moverPosition,
  pickupPosition,
  dropoffPosition,
  originPosition,
  onRouteSummaryChange,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  moverPosition: { lat: number; lng: number } | null;
  pickupPosition: { lat: number; lng: number } | null;
  dropoffPosition: { lat: number; lng: number } | null;
  originPosition: { lat: number; lng: number } | null;
  onRouteSummaryChange: (summary: RouteSummary | null) => void;
}) {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: googleMapsLoaderId,
    libraries: googleLibraries,
  });

  useEffect(() => {
    if (!isLoaded || !originPosition || !dropoffPosition) {
      setDirections(null);
      onRouteSummaryChange(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: originPosition,
        destination: dropoffPosition,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        if (status !== "OK" || !result) {
          setDirections(null);
          setRouteIndex(0);
          onRouteSummaryChange(null);
          return;
        }

        const shortestRouteIndex = getShortestRouteIndex(result.routes);
        const leg = result.routes[shortestRouteIndex]?.legs[0];
        setDirections(result);
        setRouteIndex(shortestRouteIndex);
        onRouteSummaryChange(
          leg?.distance?.text && leg?.duration?.text
            ? {
                distanceText: leg.distance.text,
                durationText: leg.duration.text,
              }
            : null
        );
      }
    );
  }, [dropoffPosition, isLoaded, onRouteSummaryChange, originPosition]);

  if (!isLoaded) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-gray-100 text-center text-gray-600">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {moverPosition && <Marker position={moverPosition} label="M" />}
      {pickupPosition && <Marker position={pickupPosition} label="P" />}
      {dropoffPosition && <Marker position={dropoffPosition} label="D" />}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            markerOptions: { visible: false },
            preserveViewport: false,
            routeIndex,
            polylineOptions: {
              strokeColor: "#468AD1",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            },
          }}
        />
      )}
    </GoogleMap>
  );
}

function getShortestRouteIndex(routes: google.maps.DirectionsRoute[]) {
  return routes.reduce(
    (shortestIndex, route, index) => {
      const routeDistance = route.legs.reduce(
        (total, leg) => total + (leg.distance?.value || 0),
        0
      );

      return routeDistance < shortestIndex.distance
        ? { index, distance: routeDistance }
        : shortestIndex;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY }
  ).index;
}
