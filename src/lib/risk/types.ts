export interface RiskInput {

  scenario: string;

  asset: string;

  exposure: string;

  probability: number;

  impact: number;

  cvss: number;

  epss: number;

  exploit: boolean;

  controls: {
    edr: boolean;
    mfa: boolean;
    waf: boolean;
    segmentation: boolean;
    backup: boolean;
    soc: boolean;
  };

}

export interface RiskResult {

  score: number;

  level: string;

  color: string;

  recommendation: string;

}