#include <cstdio>
#include <string>
#define SHADOWREALM_ADMIN_BUILD
#include "shadowrealm_gm.hpp"
int main(int argc,char**argv){
    if(argc<2){printf("usage: keygen <password>\n");return 1;}
    auto k = AdminAuth::deriveKey(argv[1]);   // uses the SAME salt+iters
    for(int i=0;i<32;i++){printf("0x%02x,",k[i]); if(i%8==7)printf("\n");}
    return 0;
}
