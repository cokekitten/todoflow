import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" {...props} />;
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2a1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9a1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1a1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6a1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .5-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.5H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
    </BaseIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 14.2A8 8 0 1 1 9.8 4A6.5 6.5 0 0 0 20 14.2Z" />
    </BaseIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" />
    </BaseIcon>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
      <path d="M8.5 19.5h7M12 16.5v3" />
    </BaseIcon>
  );
}

export function RenameIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20h4l9.8-9.8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m13.5 6.5 4 4" />
    </BaseIcon>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5c-4.7 0-8.5 3.4-8.5 7.7c0 4 3.1 7.3 7 7.3H12a1.8 1.8 0 0 0 0-3.5h-.7a1.7 1.7 0 0 1-1.5-2.5a1.8 1.8 0 0 1 1.6-.9h1.2c4.3 0 7.9-3.1 7.9-7C20.5 6 16.7 3.5 12 3.5Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="8.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="8.2" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 7.5h15" />
      <path d="M9.5 3.5h5" />
      <path d="M6.5 7.5 7.3 19a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8l.8-11.5" />
      <path d="M10 11v5M14 11v5" />
    </BaseIcon>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 13 11 22l-8.5-8.5V4h9.5L20 13Z" />
      <circle cx="7.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17" />
    </BaseIcon>
  );
}

export function EnterIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12h11" />
      <path d="m11 7 5 5-5 5" />
      <path d="M20 5v14" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m5 12 4.2 4.2L19 6.5" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m14.5 6.5-5 5.5 5 5.5" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9.5 6.5 5 5.5-5 5.5" />
    </BaseIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </BaseIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6.5 9.5 5.5 5 5.5-5" />
    </BaseIcon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </BaseIcon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 8v.5M12 11v5" />
    </BaseIcon>
  );
}
