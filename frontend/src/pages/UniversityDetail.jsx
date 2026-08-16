import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Library,
  Mail,
  MapPin,
  Phone,
  School,
} from "lucide-react";
import api from "../api/client.js";

const labelFromEnum = (value) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const formatPhoneHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

const externalLinkProps = {
  target: "_blank",
  rel: "noreferrer",
};

export default function UniversityDetail() {
  const { idOrSlug } = useParams();

  const university = useQuery({
    queryKey: ["university-detail", idOrSlug],
    queryFn: () => api.get(`/universities/${idOrSlug}`).then((r) => r.data),
  });

  if (university.isLoading) return <p className="page-shell py-12 text-sm text-muted">Loading university...</p>;
  if (university.isError || !university.data) {
    return (
      <div className="page-shell py-12">
        <div className="empty-state">University not found or inactive.</div>
      </div>
    );
  }

  const item = university.data;
  const primaryLibraryUrl =
    item.libraryUrl || item.digitalLibraryUrl || item.libraryCatalogUrl || item.institutionalRepositoryUrl;
  const libraryLinks = [
    { label: "Library website", url: item.libraryUrl },
    { label: "Digital library", url: item.digitalLibraryUrl },
    { label: "Library catalog", url: item.libraryCatalogUrl },
    { label: "Institutional repository", url: item.institutionalRepositoryUrl },
  ].filter((link) => link.url);
  const locationLine = [item.region, item.city].filter(Boolean).join(" - ");
  const mapUrl =
    item.latitude && item.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
      : null;

  return (
    <div className="page-shell py-10">
      <div className="mb-6">
        <Link to="/universities" className="text-sm font-semibold text-highland hover:underline">
          Back to University Directory
        </Link>
      </div>

      <section className="section-panel rounded-xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist text-highland">
              {item.logoUrl ? (
                <img src={item.logoUrl} alt={`${item.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <Building2 size={38} />
              )}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {item.verificationStatus === "VERIFIED" && (
                  <span className="badge-green">
                    <CheckCircle2 size={13} />
                    Verified
                  </span>
                )}
                <span className="badge">{labelFromEnum(item.ownership)}</span>
                <span className="badge">{labelFromEnum(item.institutionType)}</span>
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink">{item.name}</h1>
              {item.shortName && <p className="mt-2 text-lg font-semibold text-muted">{item.shortName}</p>}
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <MapPin size={16} />
                {locationLine || "Location not set"}
                {item.address && <span>- {item.address}</span>}
              </p>
            </div>
          </div>

          <Link to={`/browse?universityId=${item.id}`} className="btn-primary self-start">
            <BookOpen size={16} />
            Browse resources
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Description</h2>
            <p className="mt-3 rounded-lg border border-line bg-paper p-5 text-sm leading-7 text-ink/80">
              {item.description || "No description has been added for this institution yet."}
            </p>
          </div>

          <aside className="section-panel rounded-xl p-5">
            <p className="font-semibold text-ink">Quick links</p>
            <div className="mt-4 space-y-3">
              <QuickLink icon={Globe2} title="Official Website" label="Visit Website" url={item.website} />
              <QuickLink
                icon={School}
                title="Student Portal"
                label="Open Student Portal"
                url={item.studentPortalUrl}
                missingText="Student portal not available"
              />
              <QuickLink icon={Library} title="University Library" label="Open Library" url={primaryLibraryUrl} />
            </div>
          </aside>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Related resources</h2>
                <p className="mt-1 text-sm text-muted">Materials already connected to this university.</p>
              </div>
              <Link to={`/browse?universityId=${item.id}`} className="btn-secondary self-start">
                View all
              </Link>
            </div>

            {item.relatedResources?.length === 0 && (
              <div className="empty-state">No approved resources are associated with this university yet.</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {item.relatedResources?.map((resource) => (
                <Link key={resource.id} to={`/resources/${resource.id}`} className="surface-card rounded-lg p-5">
                  <span className="badge-green">{resource.type?.replaceAll("_", " ")}</span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{resource.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {resource.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resource.department?.name && <span className="badge">{resource.department.name}</span>}
                    {resource.courseCode && <span className="badge-gold">{resource.courseCode}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="section-panel rounded-xl p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Related useful links</h2>
                <p className="mt-1 text-sm text-muted">Useful Links are reused from the existing resource system.</p>
              </div>
              <Link to={`/browse?universityId=${item.id}&type=USEFUL_LINK`} className="btn-secondary self-start">
                View all
              </Link>
            </div>

            {item.relatedUsefulLinks?.length === 0 && (
              <div className="empty-state">No approved useful links are associated with this university yet.</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {item.relatedUsefulLinks?.map((resource) => (
                <div key={resource.id} className="surface-card rounded-lg p-5">
                  <span className="badge-green">Useful Link</span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{resource.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {resource.description || "No description provided."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <a href={resource.fileUrl} className="btn-dark min-h-10 px-3 py-2" {...externalLinkProps}>
                      <ExternalLink size={15} />
                      Open link
                    </a>
                    <Link to={`/resources/${resource.id}`} className="btn-secondary min-h-10 px-3 py-2">
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="section-panel rounded-xl p-5">
            <h2 className="font-semibold text-ink">Contact information</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <ContactRow icon={Phone} label="Phone">
                {item.contactPhone ? (
                  <a href={formatPhoneHref(item.contactPhone)} className="font-semibold text-highland hover:underline">
                    {item.contactPhone}
                  </a>
                ) : (
                  <span className="text-muted">Phone not available</span>
                )}
              </ContactRow>
              <ContactRow icon={Mail} label="Email">
                {item.contactEmail ? (
                  <a href={`mailto:${item.contactEmail}`} className="font-semibold text-highland hover:underline">
                    {item.contactEmail}
                  </a>
                ) : (
                  <span className="text-muted">Email not available</span>
                )}
              </ContactRow>
              <ContactRow icon={MapPin} label="Address">
                <span className="text-ink">{item.address || "Address not available"}</span>
              </ContactRow>
              {item.additionalContactInfo && (
                <ContactRow icon={Building2} label="Additional">
                  <span className="text-ink">{item.additionalContactInfo}</span>
                </ContactRow>
              )}
            </dl>
          </section>

          <section className="section-panel rounded-xl p-5">
            <h2 className="font-semibold text-ink">Location</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoPair label="Region" value={item.region || "Not set"} />
              <InfoPair label="City" value={item.city || "Not set"} />
              <InfoPair label="Address" value={item.address || "Not set"} />
            </dl>
            {mapUrl && (
              <a href={mapUrl} className="btn-secondary mt-5 w-full" {...externalLinkProps}>
                <MapPin size={16} />
                Open map location
              </a>
            )}
          </section>

          <section className="section-panel rounded-xl p-5">
            <h2 className="font-semibold text-ink">Library links</h2>
            {libraryLinks.length === 0 ? (
              <p className="mt-3 text-sm text-muted">University library links are not available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {libraryLinks.map((link) => (
                  <a key={link.label} href={link.url} className="btn-secondary w-full justify-between" {...externalLinkProps}>
                    <span>{link.label}</span>
                    <ExternalLink size={15} />
                  </a>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, title, label, url, missingText }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon size={17} className="text-highland" />
        {title}
      </p>
      {url ? (
        <a href={url} className="btn-secondary mt-3 w-full justify-between" {...externalLinkProps}>
          <span>{label}</span>
          <ExternalLink size={15} />
        </a>
      ) : (
        <p className="mt-3 text-sm text-muted">{missingText || `${title} not available`}</p>
      )}
    </div>
  );
}

function ContactRow({ icon: Icon, label, children }) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        <Icon size={14} className="text-highland" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function InfoPair({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
