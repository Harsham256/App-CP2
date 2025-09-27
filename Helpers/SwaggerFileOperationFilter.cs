


using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace TitleVerification.Api.Helpers
{
    public class SwaggerFileOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Find all parameters of type IFormFile
            var fileParams = context.MethodInfo.GetParameters()
                .Where(p => p.ParameterType == typeof(IFormFile))
                .ToList();

            if (!fileParams.Any()) return;

            // Configure Swagger to handle file upload
            operation.RequestBody = new OpenApiRequestBody
            {
                Content =
                {
                    ["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = fileParams.ToDictionary(
                                p => p.Name!,
                                p => new OpenApiSchema { Type = "string", Format = "binary" }
                            ),
                            Required = new HashSet<string>(
                                fileParams.Select(p => p.Name!).Where(n => n != null)
                            )
                        }
                    }
                }
            };
        }
    }
}
