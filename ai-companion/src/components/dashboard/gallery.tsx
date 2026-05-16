import Image from "next/image";
import { ImageOff, Images } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Gallery({ items }: { items: GalleryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Images className="size-5 text-primary" />
          Gallery
        </CardTitle>
        <CardDescription>
          Every image of your companion, visible only to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No images yet. Generate one above to start your gallery.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <figure
                key={item.id}
                className="group overflow-hidden rounded-lg border border-border bg-secondary"
              >
                <div className="relative aspect-square w-full">
                  {item.url ? (
                    <Image
                      src={item.url}
                      alt={item.prompt ?? "Companion image"}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-6" />
                    </div>
                  )}
                  {item.image_type === "main" && (
                    <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium">
                      Main
                    </span>
                  )}
                </div>
                <figcaption className="space-y-1 p-3">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {item.prompt ?? "Original companion portrait"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {formatDate(item.created_at)}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
