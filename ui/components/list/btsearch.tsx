import { type Key, useCallback, type MouseEvent } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Listbox,
  ListboxItem,
  Pagination,
} from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  btSearchItemsQueryOptions,
  debridAvailabilityOptions,
  debridTorrentQueryOptions,
} from "@/ui/utils/queryOptions";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Icons } from "@/ui/utils/icons";
import { copyDataToClipboard, formattedLongDate, navigateToExternalUrl } from "@/ui/utils/common";
import clsx from "clsx";
import { useDebridStore, useSelectModalStore } from "@/ui/utils/store";
import { getQueryClient } from "@/ui/utils/queryClient";
import http from "@/ui/utils/http";
import { toast } from "react-hot-toast";
import type { BTorrent } from "@/types";

const items = [
  {
    key: "link",
    label: "Open Link",
    icon: <Icons.ExternalLink />,
  },
  {
    key: "add",
    label: "Add Torrent",
    icon: <Icons.CirclePlus />,
  },
  {
    key: "availability",
    label: "Check Availability",
    icon: <Icons.CheckZoom />,
  },
  {
    key: "copy",
    label: "Copy Magnet",
    icon: <Icons.Copy />,
  },
  {
    key: "magnet",
    label: "Open Magnet",
    icon: <Icons.TorrentOutline />,
  },
];
const ControlDropdown = () => {
  const { open, cords } = useDebridStore((state) => state.dropdown);
  const { closeDropdown } = useDebridStore((state) => state.actions);
  const item = useDebridStore((state) => state.currentDebridItem) as BTorrent;
  const actions = useSelectModalStore((state) => state.actions);

  const onAction = useCallback(
    async (key: Key) => {
      if (key === "add") {
        toast.promise(
          (async () => {
            const res = await http.postForm<{ id: string }>("/debrid/torrents/addMagnet", {
              magnet: item.magnet,
            });
            const torrent = await getQueryClient().ensureQueryData(
              debridTorrentQueryOptions(res.data.id),
            );
            actions.setCurrentItem(torrent);
            actions.setOpen(true);
          })(),
          {
            loading: "Adding torrent",
            success: "Torrent added",
            error: "Failed to add torrent",
          },
          {
            error: {
              duration: 2000,
            },
          },
        );
      } else if (key === "availability") {
        toast.promise(
          getQueryClient().ensureQueryData(debridAvailabilityOptions(item.magnet)),
          {
            loading: "Checking availability",
            success: (data) =>
              data?.avaliabilities && data.avaliabilities.length > 0
                ? `${data.avaliabilities.length} Availability found`
                : "No Availability found",
            error: (err) => err.toString(),
          },
          {
            error: {
              duration: 2000,
            },
          },
        );
      } else if (key === "copy") {
        toast.promise(
          copyDataToClipboard(item.magnet),
          {
            loading: "",
            success: "Link copied",
            error: "Failed to copy",
          },
          {
            error: {
              duration: 2000,
            },
          },
        );
      } else if (key === "link") navigateToExternalUrl(item.link);
      else if (key === "magnet") navigateToExternalUrl(item.magnet);
    },
    [item?.magnet],
  );
  return (
    <Dropdown
      isOpen={open}
      onOpenChange={closeDropdown}
      classNames={{
        content: "!bg-radial-1 bg-background",
      }}
    >
      <DropdownTrigger>
        <button type="button" className="fixed" style={{ top: cords.y, left: cords.x }} />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Options"
        itemClasses={{
          base: ["data-[hover=true]:bg-white/5", "data-[selectable=true]:focus:bg-white/5"],
        }}
        onAction={onAction}
        items={items}
      >
        {(item) => (
          <DropdownItem key={item.key} startContent={item.icon}>
            {item.label}
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};

export function BtSearchList() {
  const search = useSearch({ from: "/_authed/btsearch" });

  const { data } = useSuspenseQuery(btSearchItemsQueryOptions(search));

  const actions = useDebridStore((state) => state.actions);

  const onDropDownOpen = useCallback((e: MouseEvent, item: any) => {
    e.stopPropagation();
    actions.openDropdown();
    actions.setDropdownCords({ x: e.clientX, y: e.clientY });
    actions.setCurrentDebridItem(item);
  }, []);

  const navigate = useNavigate();

  const handlePageChange = useCallback(
    (page: number) =>
      navigate({ to: "/btsearch", search: (prev) => ({ ...prev, page }), resetScroll: true }),
    [],
  );

  return (
    <>
      <div className="flex">
        {data.torrents.length > 0 && (
          <Pagination
            showControls
            page={data.meta.page}
            total={data.meta.pages}
            onChange={handlePageChange}
          />
        )}
      </div>
      {!search.q && null}
      {!!search.q && (
        <>
          <ControlDropdown />
          <Listbox
            classNames={{
              base: "overflow-auto",
              list: "gap-4 px-2",
            }}
            items={data.torrents}
            selectionMode="none"
            emptyContent={
              <p className="text-center text-lg text-zinc-400 absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                No torrents found
              </p>
            }
          >
            {(item) => (
              <ListboxItem
                classNames={{
                  base: "rounded-3xl data-[hover=true]:bg-white/5",
                }}
                key={item.magnet}
                textValue={item.title}
              >
                <div className="grid gap-x-4 gap-y-1 md:gap-y-0 cursor-pointer grid-cols-6 rounded-3xl p-2">
                  <div className="col-start-1 col-span-6 sm:col-span-5">
                    <p title={item.title} className="text-base truncate">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex ml-auto col-start-6 col-end-6 order-2 sm:order-none">
                    <Button
                      disableRipple
                      variant="light"
                      title={"Options"}
                      isIconOnly
                      onClick={(e) => onDropDownOpen(e, item)}
                      className="data-[hover=true]:bg-transparent"
                    >
                      <Icons.Dots />
                    </Button>
                  </div>

                  <div className="items-center flex col-start-1 col-span-5">
                    <p className="text-sm text-zinc-400 min-w-20">{item.size}</p>
                    <p className="text-sm text-zinc-400">{formattedLongDate(item.createdAt)}</p>
                  </div>
                </div>
              </ListboxItem>
            )}
          </Listbox>
        </>
      )}
    </>
  );
}
