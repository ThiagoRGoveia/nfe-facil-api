function parseResponse(response: string): object {
  try {
    // Extract JSON content between curly braces
    const start = response.indexOf('{');
    const end = response.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in response');
    }

    const jsonString = response.slice(start, end + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(error);
    throw new Error('Could not parse document');
  }
}

const response = `csacsac sac as csa asdasd v
adsv asvd da
v 
a
 d
 dvsa 
 sad
  advs sda v{
  "Prefeitura.Municipal": "[Município emissor da NFS-e]",
  "Chave.Acesso.NFS_e": "[Chave de acesso completa da NFS-e]",
  "Autenticidade.NFS_e": "[Texto explicativo sobre a autenticação da NFS-e]",
  "Numero.NFS_e": "[Número da NFS-e]"

}cs vsaf sa nainkujsvanui

sadvs
adv 
dsav
 asdv 
 sad `;

console.log(parseResponse(response));
