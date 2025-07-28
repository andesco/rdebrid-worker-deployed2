import type { FC } from "react";
import { Button, type ButtonProps } from "@heroui/react";
import { useClipboard } from "@heroui/use-clipboard";
import { Icons } from "@/ui/utils/icons";

export interface CopyButtonProps extends ButtonProps {
  value?: string;
}

export const CopyButton: FC<CopyButtonProps> = ({ value, ...buttonProps }) => {
  const { copy, copied } = useClipboard();

  return (
    <Button
      isIconOnly
      className="z-50 border-1 border-transparent bg-transparent  before:content-[''] before:block before:z-[-1] before:absolute before:inset-0 before:backdrop-blur-md before:backdrop-saturate-100 before:rounded-lg"
      size="sm"
      variant="bordered"
      onPress={() => copy(value)}
      {...buttonProps}
    >
      <Icons.CopySuccess
        className="absolute size-6 opacity-0 scale-50  data-[visible=true]:opacity-100 data-[visible=true]:scale-100 transition-transform-opacity"
        data-visible={copied}
      />
      <Icons.Copy
        className="absolute size-6 opacity-0 scale-50  data-[visible=true]:opacity-100 data-[visible=true]:scale-100 transition-transform-opacity"
        data-visible={!copied}
      />
    </Button>
  );
};
