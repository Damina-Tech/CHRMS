import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Props = {
  latitude: string;
  longitude: string;
  onChange: (coords: { latitude: string; longitude: string }) => void;
};

export function GpsLocationFields({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS not available",
        description: "This browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        });
        setLocating(false);
        toast({ title: "Location captured" });
      },
      (err) => {
        setLocating(false);
        toast({
          title: "Could not get location",
          description: err.message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const mapsUrl =
    latitude && longitude
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
      : null;

  return (
    <div className="col-span-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>GPS location</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={locating}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 mr-1" />
            )}
            Current location
          </Button>
          {mapsUrl ? (
            <Button type="button" variant="ghost" size="sm" asChild>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Google Maps
              </a>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Latitude</Label>
          <Input
            type="number"
            step="any"
            placeholder="e.g. 9.0891"
            value={latitude}
            onChange={(e) =>
              onChange({ latitude: e.target.value, longitude })
            }
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Longitude</Label>
          <Input
            type="number"
            step="any"
            placeholder="e.g. 40.8671"
            value={longitude}
            onChange={(e) =>
              onChange({ latitude, longitude: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}
