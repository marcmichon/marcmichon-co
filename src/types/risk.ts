export interface CvssData {
	version: '4.0' | '3.1' | '3.0' | '2.0' | null;
	score: number | null;
	severity: string | null;
	vector: string | null;
	source: string | null;
}

export interface EpssData {
	score: number | null;
	percentile: number | null;
	date: string | null;
}

export interface KevData {
	listed: boolean;
	dateAdded: string | null;
	dueDate: string | null;
	requiredAction: string | null;
	knownRansomwareCampaignUse: string | null;
	vulnerabilityName: string | null;
}

export interface VulnerabilityExplorerResult {
	cveId: string;
	description: string | null;
	published: string | null;
	lastModified: string | null;
	status: string | null;
	cvss: CvssData;
	epss: EpssData;
	kev: KevData;
	cwes: string[];
	references: string[];
	sources: {
		nvd: string;
		epss: string;
		kev: string;
	};
}