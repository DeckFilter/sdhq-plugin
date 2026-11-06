import { Fragment } from "react";

import type { ReviewDecisionPanelData, ReviewSettingsProfile } from "../types/article-types";

const SettingsTable = ({ rows }: { rows: [string, string][] }) => (
  <div className="sdhq-article-table">
    <table>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td className={label === "In-game settings" ? "sdhq-review-settings" : undefined}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

type ReviewDecisionPanelProps = {
  reviewMeta: ReviewDecisionPanelData;
};

const ReviewSettingsPanel = ({ profile }: {
  profile: ReviewSettingsProfile;
}) => {
  const rows: [string, string][] = [
    ["FPS limit", profile.steam.fpsCap],
    ["Refresh rate", profile.steam.refreshRate === undefined ? "" : `${profile.steam.refreshRate} Hz`],
    ["TDP limit", profile.steam.tdpLimit],
    ["GPU clock", profile.steam.gpuClockFrequency],
    ["Scaling filter", profile.steam.scalingFilter],
    ["Half Rate Shading", profile.steam.halfRateShading === undefined ? "" : profile.steam.halfRateShading ? "On" : "Off"],
    ["Proton version", profile.protonVersion],
    ["In-game settings", profile.gameSettings],
    ["Wattage", profile.battery.wattage],
    ["Temps", profile.battery.temperatures],
    ["Battery", profile.battery.gameplayTime],
  ];
  const visibleRows = rows.filter(([, value]) => value.trim());
  if (!visibleRows.length) return null;
  return (
    <>
      <h2>{profile.title || "Recommended"}</h2>
      {profile.device && <p className="sdhq-article-paragraph">{profile.device}</p>}
      <SettingsTable rows={visibleRows} />
    </>
  );
};

export const ReviewDecisionPanel = ({ reviewMeta }: ReviewDecisionPanelProps) => {
  const profiles = reviewMeta.profiles?.length ? reviewMeta.profiles : [reviewMeta];
  return <>
    {profiles.map((profile, index) => (
      <Fragment key={index}>
        <ReviewSettingsPanel profile={profile} />
      </Fragment>
    ))}
  </>;
};
