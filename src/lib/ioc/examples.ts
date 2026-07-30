import type {
  IocAnalyzerOptions,
  IocType,
} from '../../types/ioc';

export type IocExampleId =
  | 'phishing'
  | 'malware'
  | 'network'
  | 'mixed'
  | 'defanged'
  | 'empty';

export type IocExampleCategory =
  | 'Phishing'
  | 'Malware'
  | 'Network'
  | 'Mixed'
  | 'Testing';

export interface IocExample {
  id: IocExampleId;
  label: string;
  title: string;
  description: string;
  category: IocExampleCategory;
  content: string;
  expectedTypes: IocType[];
  expectedMinimumUnique: number;
  analyzerOptions?: IocAnalyzerOptions;
}

/**
 * Toutes les infrastructures utilisées ci-dessous sont exclusivement
 * réservées à la documentation et aux tests.
 *
 * Domaines :
 * - example.com
 * - example.net
 * - example.org
 *
 * IPv4 :
 * - 192.0.2.0/24
 * - 198.51.100.0/24
 * - 203.0.113.0/24
 *
 * IPv6 :
 * - 2001:db8::/32
 */
const PHISHING_EXAMPLE: IocExample = {
  id: 'phishing',
  label: 'Phishing',
  title: 'Campagne de phishing',
  description:
    'Message de démonstration contenant une URL, un domaine, une adresse email et plusieurs adresses IP.',
  category: 'Phishing',
  content: `Subject: Password expiration notification

The user received a suspicious email from:
security-alert@portal.example

The message requested authentication through:
hxxps://portal[.]example/auth/session

Observed remote address:
192.0.2.45

Internal workstation:
192.168.10.25

Additional indicator:
portal[.]example`,
  expectedTypes: [
    'Email',
    'URL',
    'Domain',
    'IPv4',
  ],
  expectedMinimumUnique: 5,
};

const MALWARE_EXAMPLE: IocExample = {
  id: 'malware',
  label: 'Malware',
  title: 'Investigation malware',
  description:
    'Rapport fictif contenant des empreintes synthétiques et une infrastructure réservée à la documentation.',
  category: 'Malware',
  content: `Malware analysis demonstration

Payload download:
hxxps://cdn[.]example/download/sample.bin

Command and control:
198.51.100.42

Associated domain:
cdn[.]example

MD5:
0123456789abcdef0123456789abcdef

SHA-1:
0123456789abcdef0123456789abcdef01234567

SHA-256:
0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

SHA-512:
0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`,
  expectedTypes: [
    'URL',
    'Domain',
    'IPv4',
    'MD5',
    'SHA-1',
    'SHA-256',
    'SHA-512',
  ],
  expectedMinimumUnique: 7,
};

const NETWORK_EXAMPLE: IocExample = {
  id: 'network',
  label: 'Réseau',
  title: 'Analyse réseau',
  description:
    'Échantillon comportant des adresses publiques de documentation, privées, loopback, link-local et réservées.',
  category: 'Network',
  content: `Network telemetry demonstration

Documentation IPv4:
192.0.2.10
198.51.100.20
203.0.113.25

Internal gateway:
10.10.0.1

Loopback:
127.0.0.1

Link-local:
169.254.10.20

Documentation IPv6:
2001:db8::42

Private IPv6:
fd12:3456:789a::10

IPv6 loopback:
::1

IPv6 link-local:
fe80::1%eth0`,
  expectedTypes: [
    'IPv4',
    'IPv6',
  ],
  expectedMinimumUnique: 10,
};

const MIXED_EXAMPLE: IocExample = {
  id: 'mixed',
  label: 'Mixte',
  title: 'Rapport d’incident mixte',
  description:
    'Scénario fictif mêlant email, réseau, URL, domaine, hashes et doublons.',
  category: 'Mixed',
  content: `Incident DEMO-2026-001

A suspicious message was received from:
alerts@verification.example

The user followed:
hxxps://verification[.]example/login

DNS telemetry shows repeated queries to:
verification[.]example
verification[.]example

Proxy logs identified:
hxxps://verification[.]example/login
hxxps://verification[.]example/download/sample.bin

Remote IP:
203.0.113.18

Internal endpoints:
192.168.20.15
192.168.20.15
10.20.30.40

Observed SHA-256:
abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789

Legacy MD5:
abcdef0123456789abcdef0123456789`,
  expectedTypes: [
    'Email',
    'URL',
    'Domain',
    'IPv4',
    'MD5',
    'SHA-256',
  ],
  expectedMinimumUnique: 9,
};

const DEFANGED_EXAMPLE: IocExample = {
  id: 'defanged',
  label: 'Defanged',
  title: 'IOC neutralisés',
  description:
    'Exemple fictif permettant de tester les principales syntaxes de defang.',
  category: 'Testing',
  content: `Defanged indicator demonstration

URL:
hxxps://secure-update[.]example/download/sample.bin

Alternative URL:
hxxp://198[.]51[.]100[.]45/sample

Domain variants:
secure-update(dot)example
cdn[dot]example

Email variants:
soc[at]example[dot]com
incident-response[@]example[.]net

IPv4:
198[.]51[.]100[.]45

SHA-256:
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`,
  expectedTypes: [
    'URL',
    'Domain',
    'Email',
    'IPv4',
    'SHA-256',
  ],
  expectedMinimumUnique: 7,
};

const EMPTY_EXAMPLE: IocExample = {
  id: 'empty',
  label: 'Vide',
  title: 'Aucun IOC',
  description:
    'Texte sans indicateur permettant de tester l’état vide du rapport.',
  category: 'Testing',
  content: `The security team reviewed the demonstration alert.

No actionable technical indicator was included in the report.

Further investigation would be required before any conclusion.`,
  expectedTypes: [],
  expectedMinimumUnique: 0,
};

export const IOC_EXAMPLES = [
  PHISHING_EXAMPLE,
  MALWARE_EXAMPLE,
  NETWORK_EXAMPLE,
  MIXED_EXAMPLE,
  DEFANGED_EXAMPLE,
  EMPTY_EXAMPLE,
] as const satisfies readonly IocExample[];

export function getIocExample(
  id: IocExampleId,
): IocExample | undefined {
  return IOC_EXAMPLES.find(
    (example) => example.id === id,
  );
}

export function getIocExampleContent(
  id: IocExampleId,
): string {
  return getIocExample(id)?.content ?? '';
}

export function getIocExamplesByCategory(
  category: IocExampleCategory,
): IocExample[] {
  return IOC_EXAMPLES.filter(
    (example) => example.category === category,
  );
}

export function getIocExampleIds(): IocExampleId[] {
  return IOC_EXAMPLES.map(
    (example) => example.id,
  );
}

export function hasExpectedIocTypes(
  expectedTypes: readonly IocType[],
  actualTypes: Iterable<IocType>,
): boolean {
  const actualTypeSet = new Set(actualTypes);

  return expectedTypes.every(
    (type) => actualTypeSet.has(type),
  );
}