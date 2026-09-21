#include <napi.h>

#include <AppKit/AppKit.h>
#include <Foundation/Foundation.h>

#include <string>
#include <vector>

// VTerm actúa como proveedor de servicios NSServices: cuando el usuario elige
// "Abrir en VTerm" en el menú contextual de una carpeta en Finder, AppKit
// entrega el pasteboard al método del objeto registrado vía NSApp.servicesProvider.
// El mensaje se declara en el Info.plist con NSMessage = openFolderInVTerm.

@class VTermServiceProvider;

static void VTermLog(const char* message);

namespace {
Napi::FunctionReference s_callback;
VTermServiceProvider* s_provider = nil;  // strong; servicesProvider es weak
NSConnection* s_connection = nil;        // strong; registra el puerto DO del servicio
}

@interface VTermServiceProvider : NSObject
@end

@implementation VTermServiceProvider

- (void)openFolderInVTerm:(NSPasteboard*)pboard
                 userData:(NSString*)userData
                    error:(NSString**)error {
  (void)userData;
  (void)error;
  std::vector<std::string> folders;
  VTermLog("[vterm] openFolderInVTerm invocado");

  NSFileManager* fm = [NSFileManager defaultManager];

  // Los servicios modernos entregan archivos como URLs (file-url).
  NSArray* urls = [pboard readObjectsForClasses:@[[NSURL class]]
                                        options:@{NSPasteboardURLReadingFileURLsOnlyKey : @YES}];
  for (NSURL* url in urls) {
    if (!url.isFileURL) continue;
    BOOL isDir = NO;
    if ([fm fileExistsAtPath:url.path isDirectory:&isDir] && isDir) {
      folders.push_back(std::string(url.path.UTF8String));
    }
  }

  // Fallback al formato clásico de nombres de archivo.
  if (folders.empty()) {
    NSArray* files = [pboard propertyListForType:@"NSFilenamesPboardType"];
    for (NSString* path in files) {
      BOOL isDir = NO;
      if ([fm fileExistsAtPath:path isDirectory:&isDir] && isDir) {
        folders.push_back(std::string(path.UTF8String));
      }
    }
  }

  if (folders.empty() || s_callback.IsEmpty()) {
    VTermLog("[vterm] sin carpetas o sin callback");
    return;
  }
  VTermLog(("[vterm] carpetas leidas: " + std::to_string(folders.size())).c_str());

  // La invocación llega por el hilo principal de AppKit, que coincide con el
  // event loop de Node, así que podemos llamar a JS sin hilos extra.
  Napi::Env env = s_callback.Env();
  Napi::Array jsFolders = Napi::Array::New(env);
  uint32_t i = 0;
  for (const std::string& folder : folders) {
    jsFolders[i++] = Napi::String::New(env, folder);
  }
  Napi::Object payload = Napi::Object::New(env);
  payload.Set("paths", jsFolders);

  s_callback.Call({payload});
}

@end

static void VTermLog(const char* message) {
  @autoreleasepool {
    NSString* line = [NSString stringWithFormat:@"%@\n", @(message)];
    NSFileHandle* h = [NSFileHandle fileHandleForWritingAtPath:@"/tmp/vterm-provider.log"];
    if (h) {
      [h seekToEndOfFile];
      [h writeData:[line dataUsingEncoding:NSUTF8StringEncoding]];
    } else {
      NSData* d = [line dataUsingEncoding:NSUTF8StringEncoding];
      [[NSFileManager defaultManager] createFileAtPath:@"/tmp/vterm-provider.log"
                                              contents:d attributes:nil];
    }
    NSLog(@"%s", message);
  }
}

static Napi::Value RegisterProvider(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "Se espera una función de callback")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!s_callback.IsEmpty()) s_callback.Reset();
  s_callback = Napi::Persistent(info[0].As<Napi::Function>());

  // NSApp existe porque el main process de Electron ES la aplicación.
  if (NSApp) {
    if (!s_provider) s_provider = [[VTermServiceProvider alloc] init];
    NSApp.servicesProvider = s_provider;
    VTermLog("[vterm] servicesProvider registrado");
  } else {
    VTermLog("[vterm] NSApp no disponible");
  }

  // En un app "normal" AppKit registra la conexión DO del servicio automáticamente,
  // pero en Electron hay que crearla a mano: NSPerformService/pbs localiza al app
  // por el nombre del puerto (CFBundleName).
  if (!s_connection && s_provider) {
    NSString* appName = [[[NSBundle mainBundle] infoDictionary]
        objectForKey:@"CFBundleName"];
    s_connection = [NSConnection serviceConnectionWithName:appName
                                                rootObject:s_provider];
    VTermLog(s_connection ? "[vterm] conexion DO de servicio registrada"
                          : "[vterm] fallo al crear conexion DO de servicio");
  }

  return env.Undefined();
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("registerProvider", Napi::Function::New(env, RegisterProvider));
  return exports;
}

NODE_API_MODULE(vterm_macos_services, Init)