declare module "*?raw" {
  const content: string;
  export default content;
}
declare module "*.hbs.js" {
  const content: TemplateSpecification;
  export default content;
}
