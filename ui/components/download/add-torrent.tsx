import { Button, Input } from "@heroui/react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useCallback, useRef, useState } from "react";
import { magnetRegex } from "@/ui/utils/common";
import http from "@/ui/utils/http";
import {
  debridAvailabilityOptions,
  debridTorrentQueryOptions,
} from "@/ui/utils/queryOptions";
import { useSelectModalStore } from "@/ui/utils/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "feaxios";
import { Icons } from "@/ui/utils/icons";
import { decodeTorrentFile, toMagnetURI } from "@/ui/utils/parse-torrent";

const initialformState = {
  torrentPath: "",
  magnet: "",
  hash: "",
};

export const AddTorrent = () => {
  const { control, handleSubmit, setValue, setError } = useForm({
    defaultValues: initialformState,
  });

  const actions = useSelectModalStore((state) => state.actions);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const magnet = useWatch({
    control,
    name: "magnet",
  });

  const torrentPath = useWatch({
    control,
    name: "torrentPath",
  });

  const { data, isFetched, isLoading, isRefetching, refetch } = useQuery(
    debridAvailabilityOptions(magnet)
  );

  const onSubmit = useCallback(async (data: typeof initialformState) => {
    try {
      let id = "";
      setIsSubmitting(true);
      if (data.magnet) {
        const res = (
          await http.postForm<{ id: string }>("/debrid/torrents/addMagnet", {
            magnet: data.magnet,
          })
        ).data;
        id = res.id;
      }
      const torrent = await queryClient.ensureQueryData(
        debridTorrentQueryOptions(id)
      );
      actions.setCurrentItem(torrent);
      actions.setOpen(true);
    } catch (error) {
      if (error instanceof Error) {
        setError("magnet", { message: error.message });
      } else if (error instanceof AxiosError) {
        setError("magnet", { message: error.response?.data?.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const onTorrentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setValue("torrentPath", file.name);
        file.arrayBuffer().then((buffer) => {
          decodeTorrentFile(new Uint8Array(buffer)).then((torrent) => {
            setValue("magnet", toMagnetURI(torrent as any));
          });
        });
      }
    },
    []
  );

  return (
    <form
      className="size-full flex gap-6 flex-col"
      onSubmit={handleSubmit(onSubmit)}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".torrent"
        onChange={onTorrentChange}
      />
      <div className="flex flex-col gap-6">
        <Input
          label="Upload Torrent"
          value={torrentPath}
          readOnly
          onClick={() => inputRef.current?.click()}
          endContent={
            <Icons.Upload
              className="cursor-pointer text-xl"
              onClick={() => inputRef.current?.click()}
            />
          }
          classNames={{
            base: "cursor-pointer",
            input: "focus:outline-none focus:ring-0 cursor-pointer",
            inputWrapper: "cursor-pointer"
          }}
        />
        <Input
          label="Magnet Link"
          value={magnet}
          onChange={(e) => setValue("magnet", e.target.value)}
          classNames={{
            input: "focus:outline-none focus:ring-0"
          }}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          isLoading={isSubmitting}
          color="primary"
          variant="solid"
        >
          Add Torrent
        </Button>
        <Button
          onPress={() => refetch()}
          isDisabled={!magnet}
          color="primary"
          variant="solid"
          isLoading={isLoading || isRefetching}
          startContent={
            !(isLoading || isRefetching) ? (
              <Icons.TorrentOutline className="size-[20px]" />
            ) : null
          }
        >
          Avaliability
        </Button>
        {isFetched ? (
          data?.avaliabilities && data.avaliabilities.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <Icons.CheckCircle className="text-success" />
              <p className="text-sm">Avaliable</p>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Icons.Exclamation className="text-danger" />
              <p className="text-sm">Not Avaliable</p>
            </span>
          )
        ) : null}
      </div>
    </form>
  );
};
