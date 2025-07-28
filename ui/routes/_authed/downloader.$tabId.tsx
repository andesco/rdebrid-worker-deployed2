import { createFileRoute } from "@tanstack/react-router";
import { AddTorrent } from "@/ui/components/download/add-torrent";
import { UnRestrictLink } from "@/ui/components/download/unrestrict-link";
import type { DownloadTab } from "@/types";
import { memo } from "react";
import { debridTorrentQueryOptions } from "@/ui/utils/queryOptions";

const titleMap = {
  links: "Unrestrict Links",
  torrents: "Add Torrents",
};

export const Route = createFileRoute("/_authed/downloader/$tabId")({
  component: memo(Component),
  validateSearch: (search: Record<string, unknown>) =>
    search as { fileId?: string; restrictedId?: string },
  loaderDeps: ({ search }) => ({ search }),
  meta: ({ params }) => [
    {
      title: titleMap[params.tabId as DownloadTab],
    },
  ],
  loader: ({ context: { queryClient }, deps: { search }, params }) => {
    if (search.fileId && params.tabId === "links") {
      return queryClient.ensureQueryData(debridTorrentQueryOptions(search.fileId));
    }
  },
  wrapInSuspense: true,
});

function Component() {
  const { tabId } = Route.useParams();

  switch (tabId as DownloadTab) {
    case "torrents":
      return <AddTorrent />;
    case "links":
      return <UnRestrictLink />;
    default:
      return null;
  }
}
