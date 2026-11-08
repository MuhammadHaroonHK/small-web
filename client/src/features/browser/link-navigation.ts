export type LinkResolution =
  | {
      kind: "internal";
      address: string;
    }
  | {
      kind: "unsupported";
      destination: string;
    };

const INTERNAL_ADDRESS =
  /^smallweb:\/\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const ADDRESS_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveInternalLink(
  href: string,
  currentAddress: string,
): LinkResolution {
  const destination = href.trim();

  if (
    !destination ||
    destination.length > 2048 ||
    /[\u0000-\u001f\u007f]/.test(destination) ||
    destination.startsWith("//")
  ) {
    return { kind: "unsupported", destination: destination || href };
  }

  try {
    const baseAddress = currentAddress.endsWith("/")
      ? currentAddress
      : `${currentAddress}/`;
    const resolved = new URL(destination, baseAddress);

    if (
      resolved.protocol !== "smallweb:" ||
      resolved.username ||
      resolved.password ||
      resolved.port
    ) {
      return { kind: "unsupported", destination };
    }

    const segments = [
      resolved.hostname,
      ...resolved.pathname.split("/").filter(Boolean),
    ]
      .map((segment) => decodeURIComponent(segment).toLowerCase());

    if (
      !segments.length ||
      segments.some((segment) => !ADDRESS_SEGMENT.test(segment))
    ) {
      return { kind: "unsupported", destination };
    }

    const address = `smallweb://${segments.join("/")}`;

    if (!INTERNAL_ADDRESS.test(address)) {
      return { kind: "unsupported", destination };
    }

    return { kind: "internal", address };
  } catch {
    return { kind: "unsupported", destination };
  }
}
